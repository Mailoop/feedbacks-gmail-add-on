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
 * Builds a card that displays the search options for scheduling a meeting.
 *
 * @param {Object} opts Parameters for building the card
 * @param {number} opts.durationMinutes - Default meeting duration in minutes
 * @param {number} opts.startHour - Default start of workday, as hour of day (0-23)
 * @param {number} opts.endHour - Default end of workday, as hour of day (0-23)
 * @param {string[]} opts.emailAddresses - Email addresses of participants
 * @param {Object} opts.state - State to pass on to subsequent actions
 * @return {Card}
 */

var behaviorIconUrl = function(behaviorName) {
  return('https://mailoop.blob.core.windows.net/static/Assets/Images/' + behaviorName + '_64.png')
}  
  
function buildSearchCard(opts) {

  var behaviors = JSON.parse(opts.behaviors).filter(function (vote) {
    return (vote.category === "message");
  })

  var votes = JSON.parse(opts.votes)

  var smartDeconnexionSection = CardService.newCardSection()
    .addWidget(
      CardService.newKeyValue()
        .setContent("Smart deconnexion")
        .setSwitch(CardService.newSwitch()
          .setFieldName("form_input_switch_key")
          .setValue("form_input_switch_value")
          .setOnChangeAction(CardService.newAction()
            .setFunctionName("handleSwitchChange")))
    )

  const iconUrl = "https://cdn2.iconfinder.com/data/icons/medical-services-2/256/Health_Tests-512.png"


  const positiveBehavior = behaviors.filter( function(behavior) {
    return(behavior.family === 1);  
  });

  const neutralBehavior = behaviors.filter(function (behavior) {
    return (behavior.family === 0);
  });

  const negativeBehavior = behaviors.filter(function (behavior) {
    return (behavior.family === -1);
  });

  var positiveFeedbacksSections = []
  _.each(positiveBehavior, function (behavior) {
    var vote = (votes.filter(function (vote) {
      Logger.log("")
      Logger.log(Math.floor(vote.behavior_id).toString(10))
      Logger.log(Math.floor(behavior.id).toString(10))
      Logger.log(Math.floor(vote.behavior_id).toString(10) === Math.floor(behavior.id).toString(10))
      return (Math.floor(vote.behavior_id).toString(10) === Math.floor(behavior.id).toString(10));
    }))
    Logger.log("")
    Logger.log("vote")
    Logger.log(vote)
    var voted

    Logger.log(vote)
    if (vote.length > 0 ) {
      voted = true
    } else {
      voted = false
    }
    Logger.log("voted")
    Logger.log(voted)




    var onVoteAction = createAction_('sendUserVote', {
      date: opts.date,
      refName: behavior.ref_name,
      to: opts.to,
      internetMessageId: opts.internetMessageId,
      from: opts.from,
    })

    positiveFeedbacksSections.push(
      CardService.newCardSection()
      .addWidget(CardService.newKeyValue()
        .setIconUrl(behaviorIconUrl(behavior.ref_name))
        .setContent(behavior.ref_name)
        //.setOnClickAction(onVoteAction)
        .setSwitch(CardService.newSwitch()
          .setSelected(voted)
          .setFieldName("V16:votableId:" + opts.internetMessageId + "behaviorId:" + behavior.ref_name  )
          .setValue(voted)
          .setOnChangeAction(onVoteAction))
      )
    )
  })


  var neutralFeedbacksSections = []
  _.each(neutralBehavior, function (behavior) {
    var onVoteAction = createAction_('sendUserVote')

    neutralFeedbacksSections.push(
      CardService.newCardSection()
        .addWidget(CardService.newKeyValue()
          .setIconUrl(behaviorIconUrl(behavior.ref_name))
          .setContent(behavior.ref_name)
          //.setOnClickAction(onVoteAction)
          .setSwitch(CardService.newSwitch()
            .setFieldName("form_input_switch_key")
            .setValue("form_input_switch_value")
            .setOnChangeAction(onVoteAction))
        )
    )
  })



  var negativeFeedbacksSections = []
  _.each(negativeBehavior, function (behavior) {
    var onVoteAction = createAction_('sendUserVote')

    negativeFeedbacksSections.push(
      CardService.newCardSection()
        .addWidget(CardService.newKeyValue()
          .setIconUrl(behaviorIconUrl(behavior.ref_name))
          .setContent(behavior.translations.fr.name)
          //.setOnClickAction(onVoteAction)
          .setSwitch(CardService.newSwitch()
            .setFieldName("form_input_switch_key")
            .setValue("form_input_switch_value")
            .setOnChangeAction(onVoteAction))
        )
    )
  })



  




  // <= for example

  var addSections = function(cardBuilder, sections) {
    _.each(sections, function (section) {
      cardBuilder.addSection(section)
    })
    return cardBuilder
  }

  cardBuilder = CardService.newCardBuilder()
  cardBuilder.addSection(smartDeconnexionSection)

  cardBuilder.addSection(
    CardService.newCardSection().addWidget(
      CardService.newTextParagraph().setText("Positif 🙂")
      )
  )
  addSections(cardBuilder, positiveFeedbacksSections)


  cardBuilder.addSection(
    CardService.newCardSection().addWidget(
      CardService.newTextParagraph().setText("Neutre 😐")
    )
  )
  addSections(cardBuilder, neutralFeedbacksSections)


  cardBuilder.addSection(
    CardService.newCardSection().addWidget(
      CardService.newTextParagraph().setText("Negatif 🙁")
    )
  )

  addSections(cardBuilder, negativeFeedbacksSections)
  return cardBuilder.build();
}

/**
 * Builds a card that displays the results of a search and allows scheduling a meeting.
 *
 * @param {Object} opts Parameters for building the card
 * @param {boolean} opts.showPartialResponseWarning - True if should warn not all calendars were searched
 * @param {TimePeriod[]} opts.freeTimes - Candidate meeting times
 * @param {string} opts.subject - Default event subject
 * @param {any} opts.timezone - User's timezone
 * @param {Object} opts.state - State to pass on to subsequent actions
 * @return {Card}
 */
function buildResultsCard(opts) {
  var section = CardService.newCardSection();

  if (opts.showPartialResponseWarning) {
    section.addWidget(
      CardService.newTextParagraph().setText(
        "Note: Some calendars were not available."
      )
    );
  }

  var timeSelectWidget = CardService.newSelectionInput()
    .setFieldName("time")
    .setType(CardService.SelectionInputType.RADIO_BUTTON);

  _.each(opts.availableTimes, function(timePeriod, index) {
    var localizedTime = moment(timePeriod.start).tz(opts.timezone);
    var label = localizedTime.format("dd, MMM Do, h:mm a");
    timeSelectWidget.addItem(label, localizedTime.valueOf(), index == 0);
  });

  section.addWidget(timeSelectWidget);
  section.addWidget(
    CardService.newTextInput()
      .setMultiline(false)
      .setTitle("Subject")
      .setFieldName("subject")
      .setValue(opts.subject)
  );
  section.addWidget(
    CardService.newTextInput()
      .setMultiline(true)
      .setTitle("Note to attendees")
      .setFieldName("note")
  );
  section.addWidget(
    CardService.newButtonSet().addButton(
      CardService.newTextButton()
        .setText("Send meeting invite")
        .setOnClickAction(
          createAction_("createMeeting", { state: JSON.stringify(opts.state) })
        )
    )
  );

  return CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle("Suggested times"))
    .addSection(section)
    .build();
}

/**on
 * Builds a card that displays confirmation of the event.
 *
 * @param {Object} opts Parameters for building the card
 * @param {number|date} opts.eventTime - Start time of event
 * @param {string} opts.timezone - User's timezone
 * @param {string} opts.eventLink - URL of event in calendar
 * @return {Card}
 */
function buildConfirmationCard(opts) {
  var formattedTime = moment(opts.eventTime)
    .tz(opts.timezone)
    .calendar();
  var section = CardService.newCardSection();
  section.addWidget(
    CardService.newTextParagraph().setText("Created event for " + formattedTime)
  );
  section.addWidget(
    CardService.newButtonSet().addButton(
      CardService.newTextButton()
        .setText("View in Google Calendar")
        .setOpenLink(
          CardService.newOpenLink()
            .setUrl(opts.eventLink)
            .setOpenAs(CardService.OpenAs.FULL_SIZE)
        )
    )
  );
  return CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle("Event created"))
    .addSection(section)
    .build();
}

/**
 * Builds a card that displays the user settings.
 *
 * @param {Object} opts Parameters for building the card
 * @param {number} opts.durationMinutes - Default meeting duration in minutes
 * @param {number} opts.startHour - Default start of workday, as hour of day (0-23)
 * @param {number} opts.endHour - Default end of workday, as hour of day (0-23)
 * @param {string} opts.timezone - Timezone of the User
 * @param {string} opts.country - Timezone of the User
 * @param {number} opts.searchRangeDays - How many days ahead to search calendars
 * @param {string} opts.emailBlacklist - List of email addresses to ignore
 * @return {Card}
 */
function buildSettingsCard(opts) {

  var preferenceSection = CardService.newCardSection()
    .addWidget(
      createTimeSelectDropdown_("Start of day", "start", opts.startHour)
    )
    .addWidget(createTimeSelectDropdown_("End of day", "end", opts.endHour))
      
    .addWidget(
      CardService.newSelectionInput()
      .setFieldName("timezone")
      .setTitle("Timezone")
      .setType(CardService.SelectionInputType.DROPDOWN)
      .addItem("Paris", "Europe/Paris", opts.timezone == "Europe/Paris")
      .addItem("London", "Europe/London", opts.timezone == "Europe/London")
    )

    .addWidget(
      CardService.newSelectionInput()
        .setFieldName("country")
        .setTitle("Country")
        .setType(CardService.SelectionInputType.DROPDOWN)
        .addItem("France", "FR", opts.country == "FR")
        .addItem("United-Kingdom", "GB", opts.country == "GB")
    )

  preferenceSection.addWidget(
    CardService.newButtonSet()
      .addButton(
        CardService.newTextButton()
          .setText("Save")
          .setOnClickAction(createAction_("saveSettings", {}))
      )
  );

  return CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle("Smart deconnexion Settings"))
    .addSection(preferenceSection)
    .build();
}

/**
 * Builds a card that displays details of an error.
 *
 * @param {Object} opts Parameters for building the card
 * @param {Error} opts.exception - Exception that caused the error
 * @param {string} opts.errorText - Error message to show
 * @param {boolean} opts.showStackTrace - True if full stack trace should be displayed
 * @return {Card}
 */
function buildErrorCard(opts) {
  var errorText = opts.errorText;

  if (opts.exception && !errorText) {
    errorText = opts.exception.toString();
  }

  if (!errorText) {
    errorText = "No additional information is available.";
  }

  var card = CardService.newCardBuilder();
  card.setHeader(
    CardService.newCardHeader().setTitle("An unexpected error occurred")
  );
  card.addSection(
    CardService.newCardSection().addWidget(
      CardService.newTextParagraph().setText(errorText)
    )
  );

  if (opts.showStackTrace && opts.exception && opts.exception.stack) {
    var stack = opts.exception.stack.replace(/\n/g, "<br/>");
    card.addSection(
      CardService.newCardSection()
        .setHeader("Stack trace")
        .addWidget(CardService.newTextParagraph().setText(stack))
    );
  }

  return card.build();
}

/**
 * Creates an action that routes through the `dispatchAction` entry point.
 *
 * @param {string} name - Action handler name
 * @param {Object} opt_params - Additional parameters to pass through
 * @return {Action}
 * @private
 */
function createAction_(name, opt_params) {
  var params = _.extend({}, opt_params);
  params.action = name;
  return CardService.newAction()
    .setFunctionName("dispatchAction")
    .setParameters(params);
}

/**
 * Creates a drop down for selecting meeting durations.
 *
 * @param {string} label - Top label of widget
 * @param {string} name - Key used in form submits
 * @param {number} defaultValue - Default duration to select (in minutes)
 * @return {SelectionInput}
 * @private
 */
function createDurationDropdown_(label, name, defaultValue) {
  var maxDuration = 60 * 8;
  var widget = CardService.newSelectionInput()
    .setTitle(label)
    .setFieldName(name)
    .setType(CardService.SelectionInputType.DROPDOWN);
  for (var i = 30; i < maxDuration; i += 30) {
    var text = "";
    var duration = moment.duration(i, "minutes");
    if (duration.hours() > 0) {
      text += moment.duration(duration.hours(), "hours").humanize();
    }
    if (duration.minutes() > 0) {
      if (text) {
        text += " ";
      }
      text += moment.duration(duration.minutes(), "minutes").humanize();
    }
    widget.addItem(text, i, i == defaultValue);
  }
  return widget;
}
/**
 * Creates a drop down for selecting a time of day (hours only).
 *
 * @param {string} label - Top label of widget
 * @param {string} name - Key used in form submits
 * @param {number} defaultValue - Default duration to select (0-23)
 * @return {SelectionInput}
 * @private
 */
function createTimeSelectDropdown_(label, name, defaultValue) {
  var widget = CardService.newSelectionInput()
    .setTitle(label)
    .setFieldName(name)
    .setType(CardService.SelectionInputType.DROPDOWN);
  for (var i = 0; i < 24; ++i) {
    var text = moment()
      .hour(i)
      .minutes(0)
      .format("hh:mm a");
    widget.addItem(text, i, i == defaultValue);
  }
  return widget;
}
