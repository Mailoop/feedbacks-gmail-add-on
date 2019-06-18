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


  var behaviors = [
    { ref_name: "positif", priority: 1, family: 1, category: "message", translations: { "en": { "name": "Positive effect", "description": "I feel this email contributes positively to my work day." }, "fr": { "name": "Positive attitude", "description": "Cet e-mail fait du bien et contribue positivement à ma journée de travail !" } } },
    { ref_name: "ordre", priority: 0, family: 1, category: "meeting", translations: { "fr": { "name": "Ordre du jour", "description": "Il n'y avait pas d'ordre du jour" } } },
    
    { ref_name: "parlons-en", priority: 4, family: 0, category: "message", translations: { "en": { "name": "Let's talk!", "description": "I would have preferred to talk about this face to face." }, "fr": { "name": "Parlons-en !", "description": "J'aurais préféré avoir cette conversation de vive voix pour limiter mes e-mails !" } } },
    { ref_name: "meeting_efficace", priority: undefined, family: 1, category: "meeting", translations: { "en": { "name": "Efficient", "description": "We succeed in answering efficiently to the agenda thanks to this meeting." }, "fr": { "name": "Efficace", "description": "Cette réunion a permis de traiter efficacement les questions identifiées en amont." } } },
    { ref_name: "parole", priority: 0, family: 0, category: "meeting", translations: { "fr": { "name": "Laissez moi parler !", "description": "Je n'ai pas pu m'exprimer librement au cours de la réunion" }, "en": { "name": "Let me speak!", "description": "I did not have the opportunity to express my opinions during this meeting" } } },
    { ref_name: "sexiste", priority: undefined, family: -1, category: "message", translations: { "fr": { "name": "Sexiste", "description": "Le mail comporte des propos sexiste." } } },
    { ref_name: "media_teams", priority: 6, family: 0, category: "message", translations: { "en": { "name": "Share it on Teams", "description": "I would prefer to find this information on Teams and not by email." }, "fr": { "name": "Mets-le sur Teams", "description": "Je pense que cette discussion aurait intérêt à se passer sur Teams." } } },

    { ref_name: "media", priority: undefined, family: -1, category: "message", translations: { "fr": { "name": "Media", "description": "Le mail n'est pas la bonne solution de communication pour cet échange." } } },
    { ref_name: "horaires", priority: 1, family: -1, category: "message", translations: { "en": { "name": "Outside working hours", "description": "Receing this email ouside of my working hours made me uncomfortable" }, "fr": { "name": "Hors des horaires", "description": "J'ai été gêné par cet e-mail envoyé en dehors de mes horaires de travail" } } }
  ]

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
    var onVoteAction = createAction_('notificationCallback')

    positiveFeedbacksSections.push(
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


  var neutralFeedbacksSections = []
  _.each(neutralBehavior, function (behavior) {
    var onVoteAction = createAction_('notificationCallback')

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
    var onVoteAction = createAction_('notificationCallback')

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
