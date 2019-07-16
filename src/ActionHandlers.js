// Copyright 2017 Google Inc. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * Collection of functions to handle user interactions with the add-on.
 *
 * @constant
 */

 function createAction_(name, opt_params) {
  var params = _.extend({}, opt_params);
  params.action = name;
  return CardService.newAction()
    .setFunctionName("dispatchAction")
    .setParameters(params);
}

var HOST = "staging.app.mailoop.com"

var ActionHandlers = {
  /**
   * Displays the meeting search card.
   *
   * @param {Event} e - Event from Gmail
   * @return {UniversalActionResponse}
   */

  showSearchForm: function (e) {
    var settings = getSettingsForUser();
    var message = getCurrentMessage(e);
    var people = extractRecipients(message, settings.emailBlacklist);
    var subject = message.getSubject();
    var messageDate = message.getDate()
    var internetMessageId = message.getHeader("Message-ID")

    var base64InternetMessageId = Utilities.base64Encode(internetMessageId)

    var behaviorsUrl = 'https://'+ HOST +'/api/v2/behaviors_groups/default_onboarding'
    var behaviors = UrlFetchApp.fetch(behaviorsUrl)

    var url = 'https://' + HOST +'/api/v2/emails/' + 
      base64InternetMessageId
      + "/votes?X-Google-Oauth-Token=" + ScriptApp.getOAuthToken()
      var votes = UrlFetchApp.fetch(url)


    var opts = {
      startHour: settings.startHour,
      endHour: settings.endHour,
      durationMinutes: settings.durationMinutes,
      date: JSON.stringify(messageDate),
      to: JSON.stringify(people),
      from: message.getTo(),
      internetMessageId: internetMessageId,
      e: JSON.stringify(e),
      votes : votes,
      behaviors: behaviors,

      state: {
        messageId: e.messageId,
        subject: subject,
        timezone: "Europe/Paris",
      }
    };
    //var card = buildFeedbakcsCard(opts);
    var card = buildProductChoiceCard();
    return [card];
  },

  sendProductChoice: function(e) {
    var product = e.parameters.product

    var productChoiceResponse= JSON.parse(
    UrlFetchApp.fetch(
      'https://' + HOST + '/api/v2/employees/me@me.com/choose_product', {
        'method': 'post',
        'contentType': 'application/json',
        
        'payload': JSON.stringify({
          'X-Google-Oauth-Token': ScriptApp.getOAuthToken(),
          'product': product
        })
      })
    )

    if (productChoiceResponse.action == "REDIRECT") {
      return(
        CardService.newActionResponseBuilder()
        .setOpenLink(CardService.newOpenLink()
        .setUrl(productChoiceResponse.url)
        .setOpenAs(CardService.OpenAs.FULL_SIZE)
        .setOnClose(CardService.OnClose.RELOAD_ADD_ON)
        ).build()
      ) 
    }

    else {
      return(
        CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification()
        .setText("Product choosen"))
        .build()
      )
    }
  },
  sendUserVote: function(e) {

    if (e.parameters.onVoteCreate) {

      UrlFetchApp.fetch(
        'https://' + HOST +'/api/v2/votes/execute', {
          'method': 'post',
          'contentType': 'application/json',

          'payload': JSON.stringify({
            'X-Google-Oauth-Token': ScriptApp.getOAuthToken(),
            'create_action': e.parameters.onVoteCreate,
            'vote': {
              'behavior_ref_name': e.parameters.refName,
              'email': {
                'to': e.parameters.to,
                'from': e.parameters.from,
                'date': e.parameters.date ,
                'internet_message_id': e.parameters.internetMessageId,
              }
            }})
        })

    }
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification()
        .setText("Mailoop a enregistré votre feedback"))
      .build();
  },
  notificationCallback: function() {
  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification()
      .setText("Mailoop a enregistré votre feedback"))
    .build();
  },
  /**
   * Searches for free times and displays a card with the results.
   *
   * @return {ActionResponse}
   */
  findTimes: function(e) {
    var deadlineMonitor = buildDeadlineMonitor(DEFAULT_DEADLINE_SECONDS);
    var settings = getSettingsForUser();
    var state = _.assign(JSON.parse(e.parameters.state), {
      emailAddresses: e.formInputs.participants,
      durationMinutes: parseInt(e.formInput.duration),
      startHour: parseInt(e.formInput.start),
      endHour: parseInt(e.formInput.end)
    });

    // Validate time ranges -- start must be befor end
    if (state.endHour <= state.startHour) {
      return CardService.newActionResponseBuilder()
        .setNotification(
          CardService.newNotification()
            .setText("End time must be after start time.")
            .setType(CardService.NotificationType.ERROR)
        )
        .build();
    }

    // Validate time ranges -- meeting duration must fit between start/end times
    if (state.durationMinutes > (state.endHour - state.startHour) * 60) {
      return CardService.newActionResponseBuilder()
        .setNotification(
          CardService.newNotification()
            .setText(
              "Duration too long. Try a shorter duration or expand the start and end times."
            )
            .setType(CardService.NotificationType.ERROR)
        )
        .build();
    }

    var scheduler = buildScheduler({
      durationMinutes: state.durationMinutes,
      startHour: state.startHour,
      endHour: state.endHour,
      timezone: state.timezone,
      emailAddresses: state.emailAddresses,
      timezone: settings.timezone,
      deadlineMonitor: deadlineMonitor
    });

    var responseBuilder = CardService.newActionResponseBuilder();
    try { // Handle exceptions from our deadline monitor gracefully
      var response = scheduler.findAvailableTimes();
      if (response.freeTimes.length) {
        var card = buildResultsCard({
          availableTimes: response.freeTimes,
          subject: state.subject,
          showPartialResponseWarning: response.isPartialResponse,
          timezone: state.timezone,
          state: state
        });
        responseBuilder.setNavigation(
          CardService.newNavigation().pushCard(card)
        );
      } else {
        responseBuilder.setNotification(
          CardService.newNotification()
            .setText("No times available for selected participants")
            .setType(CardService.NotificationType.INFO)
        );
      }
    } catch (err) {
      if (err instanceof DeadlineExceededError) {
        responseBuilder.setNotification(
          CardService.newNotification()
            .setText("Taking too long to find a time. Try fewer participants.")
            .setType(CardService.NotificationType.WARNING)
        );
      } else {
        // Handle all other errors in the entry points
        throw err;
      }
    }

    return responseBuilder.build();
  },

  /**
   * Creates an event and displays a confirmation card.
   *
   * @param {Event} e - Event from Gmail
   * @return {ActionResponse}
   */
  createMeeting: function(e) {
    var state = JSON.parse(e.parameters.state);
    var eventTime = moment(parseFloat(e.formInputs.time)).tz(state.timezone);
    var endTime = eventTime.clone().add(state.durationMinutes, "minutes");
    var event = {
      attendees: _.map(state.emailAddresses, function(person) {
        return { email: person };
      }),
      start: {
        dateTime: eventTime.toISOString()
      },
      end: {
        dateTime: endTime.toISOString()
      },
      summary: e.formInputs.subject,
      description: e.formInputs.note
    };

    event = Calendar.Events.insert(event, "primary");
    var card = buildConfirmationCard({
      eventLink: event.htmlLink,
      eventTime: eventTime.valueOf(),
      timezone: state.timezone
    });
    return CardService.newActionResponseBuilder()
      .setNavigation(CardService.newNavigation().pushCard(card))
      .build();
  },

  /**
   * Shows the user settings card.
   * @param {Event} e - Event from Gmail
   * @return {UniversalActionResponse}
   */
  showSettings: function(e) {
    var settings = getSettingsForUser();
    var card = buildSettingsCard({
      startHour: settings.startHour,
      endHour: settings.endHour,
      timezone: settings.timezone,
      country: settings.country,
    });
    return CardService.newUniversalActionResponseBuilder()
      .displayAddOnCards([card])
      .build();
  },

  openDashboard: function (e) {

    var magicLinkUrl = 'https://' + HOST + '/api/v2/magic_link?X-Google-Oauth-Token=' + ScriptApp.getOAuthToken()

    var magicLink = JSON.parse(UrlFetchApp.fetch(magicLinkUrl)).magic_link;

    var url = "https://staging.dashboard.mailoop.com/?email=" + magicLink.email + "&temporary_password=" + magicLink.temporary_password;



    // https://region-normandie.dashboard.mailoop.com/?email=ZWRvdWFyZC5ldGFuY2VsaW5AbWFpbG9vcC5vbm1pY3Jvc29mdC5jb20=&temporary_password=1975591e-b241-419e-af8c-a1f7fd777167
    return CardService.newActionResponseBuilder()
      .setOpenLink(CardService.newOpenLink()
        .setUrl(url)
        .setOpenAs(CardService.OpenAs.FULL_SIZE)
        .setOnClose(CardService.OnClose.NOTHING)
      ).build()
  },

  /**
   * Saves the user's settings.
   *
   * @param {Event} e - Event from Gmail
   * @return {ActionResponse}
   */
  grantSmartDeconexion: function(e) {
    var url = "https://accounts.google.com/o/oauth2/v2/auth?scope=https://www.googleapis.com/auth/gmail.metadata%20https://www.googleapis.com/auth/gmail.modify%20https://www.googleapis.com/auth/gmail.labels%20https://www.googleapis.com/auth/gmail.settings.basic%20https://www.googleapis.com/auth/calendar&access_type=offline&include_granted_scopes=true&redirect_uri=https://app.mailoop.com/google/personal/authorize&response_type=code&client_id=152396156288-m6e547prq6jebkv9mk1cmacc1mjs2so0.apps.googleusercontent.com"
    return CardService.newActionResponseBuilder()
      .setOpenLink(CardService.newOpenLink()
        .setUrl(url)
        .setOpenAs(CardService.OpenAs.FULL_SIZE)
        .setOnClose(CardService.OnClose.NOTHING)
      ).build()
  },
  saveSettings: function(e) {
    var settings = {
      startHour: parseInt(e.formInput.start),
      endHour: parseInt(e.formInput.end),
      timezone: e.formInput.timezone,
      country: e.formInput.country,
    };

    UrlFetchApp.fetch(
      'https://' + HOST + '/api/v2/employees/me@me.com/deconnexion_settings', {
        'method': 'post',
        'contentType': 'application/json',

        'payload': JSON.stringify({
          'X-Google-Oauth-Token': ScriptApp.getOAuthToken(),
          'start_hour' : settings.startHour,
          'end_hour': settings.endHour,
          'time_zone': settings.timezone,
          'country' : settings.country,
        })
      })
    updateSettingsForUser(settings);
    return CardService.newActionResponseBuilder()
      .setNavigation(CardService.newNavigation().popCard())
      .setNotification(
        CardService.newNotification()
          .setText("Mailoop did save you're Smart Deconnexions Settings")
          .setType(CardService.NotificationType.INFO)
      )
      .build();
  },

  /**
   * 
   * https://accounts.google.com/signin/oauth/oauthchooseaccount?client_id=716902747725-uv0ndt7247s61j12950dmvmva2d6snmn.apps.googleusercontent.com&as=GT6ndu-heqL1puPvUv6hGw&destination=https%3A%2F%2Fadios.ai&approval_state=!ChQ1dlp3YmVYN3pDR3lXaC1PNG1zTRIfODc3dTRVV3Fwc2NUUUhVU2RlLXNqMHk3TmtRS3R4WQ%E2%88%99AJDr988AAAAAXQu4_USFOwXJax4ujZ1VD8wEnlxH_kvr&oauthriskyscope=1&xsrfsig=ChkAeAh8T6_0FyTsXK0z_RSjTSRifshP0ZPdEg5hcHByb3ZhbF9zdGF0ZRILZGVzdGluYXRpb24SBXNvYWN1Eg9vYXV0aHJpc2t5c2NvcGU&flowName=GeneralOAuthFlow
   * Resets the user settings to the defaults.
   * @param {Event} e - Event from Gmail
   * @return {ActionResponse}
   */
  resetSettings: function(e) {
    resetSettingsForUser(settings);
    var settings = getSettingsForUser();
    var card = buildSettingsCard({
      durationMinutes: settings.durationMinutes,
      startHour: settings.startHour,
      endHour: settings.endHour,
      timezone: settings.timezone,
      searchRangeDays: settings.searchRangeDays,
      emailBlacklist: settings.emailBlacklist
    });
    return CardService.newActionResponseBuilder()
      .setNavigation(CardService.newNavigation().updateCard(card))
      .setNotification(
        CardService.newNotification()
          .setText("Settings reset.")
          .setType(CardService.NotificationType.INFO)
      )
      .build();
  }
};
