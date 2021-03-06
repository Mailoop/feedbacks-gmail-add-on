

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
  return('https://' + HOST + '/assets/feedbacks/icons/' + behaviorName + '_64.png')
}


function buildProductChoiceCard(opts) {

  var preferenceSection = CardService.newCardSection()

  preferenceSection.addWidget(
    CardService.newButtonSet()
      .addButton(
        CardService.newTextButton()
          .setText("Feedbacks")
          .setOnClickAction(createAction_("sendProductChoice", {product: "feedbacks"}))
      )
      .addButton(
        CardService.newTextButton()
          .setText("Analytics")
          .setOnClickAction(createAction_("sendProductChoice", {product: "analytics"}))
      )
      .addButton(
        CardService.newTextButton()
          .setText("Smart deconnexion")
          .setOnClickAction(createAction_("sendProductChoice", {product: "smartdeconnexion"}))
      )
  );

  return CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle("Choose you're product"))
    .addSection(preferenceSection)
    .build();

}
  

function buildFeedbakcsCard(opts) {

  var employee = JSON.parse(opts.employee)



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
          .setOnChangeAction(
            createAction_("toogleSmartDeconnexion", 
              { enabled: JSON.stringify(!employee.smart_deconnexion_enabled) }
            )
    )))

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
      return (Math.floor(vote.behavior_id).toString(10) === Math.floor(behavior.id).toString(10));
    }))
    var voted

    if (vote.length > 0 ) {
      voted = true
    } else {
      voted = false
    }

    var onVoteAction = createAction_('sendUserVote', {
      onVoteCreate: JSON.stringify(!voted),
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
        .setContent(behavior.translations.fr.name)
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
    var vote = (votes.filter(function (vote) {
      return (Math.floor(vote.behavior_id).toString(10) === Math.floor(behavior.id).toString(10));
    }))
    var voted

    if (vote.length > 0) {
      voted = true
    } else {
      voted = false
    }

    var onVoteAction = createAction_('sendUserVote', {
      onVoteCreate: JSON.stringify(!voted),
      date: opts.date,
      refName: behavior.ref_name,
      to: opts.to,
      internetMessageId: opts.internetMessageId,
      from: opts.from,
    })

    neutralFeedbacksSections.push(
      CardService.newCardSection()
        .addWidget(CardService.newKeyValue()
          .setIconUrl(behaviorIconUrl(behavior.ref_name))
          .setContent(behavior.translations.fr.name)
          .setSwitch(CardService.newSwitch()
            .setSelected(voted)
            .setFieldName("V16:votableId:" + opts.internetMessageId + "behaviorId:" + behavior.ref_name)
            .setValue(voted)
            .setOnChangeAction(onVoteAction))
        )
    )
  })



  var negativeFeedbacksSections = []
  _.each(negativeBehavior, function (behavior) {
    var vote = (votes.filter(function (vote) {
      return (Math.floor(vote.behavior_id).toString(10) === Math.floor(behavior.id).toString(10));
    }))
    var voted

    if (vote.length > 0) {
      voted = true
    } else {
      voted = false
    }

    var onVoteAction = createAction_('sendUserVote', {
      onVoteCreate: JSON.stringify(!voted),
      date: opts.date,
      refName: behavior.ref_name,
      to: opts.to,
      internetMessageId: opts.internetMessageId,
      from: opts.from,
    })

    negativeFeedbacksSections.push(
      CardService.newCardSection()
        .addWidget(CardService.newKeyValue()
          .setIconUrl(behaviorIconUrl(behavior.ref_name))
          .setContent(behavior.translations.fr.name)
          .setSwitch(CardService.newSwitch()
            .setSelected(voted)
            .setFieldName("V16:votableId:" + opts.internetMessageId + "behaviorId:" + behavior.ref_name)
            .setValue(voted)
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
  //cardBuilder.addSection(smartDeconnexionSection)

  if (positiveBehavior.length > 0) {
  cardBuilder.addSection(
    CardService.newCardSection().addWidget(
      CardService.newTextParagraph().setText("<b>Positif</b> 🙂")
      )
      )
      addSections(cardBuilder, positiveFeedbacksSections)
  }

  if (neutralBehavior.length > 0) {
    cardBuilder.addSection(
      CardService.newCardSection().addWidget(
        CardService.newTextParagraph().setText("<b>Neutre</b> 😐")
      )
    )
    addSections(cardBuilder, neutralFeedbacksSections)
  }

  if (negativeBehavior.length > 0) {
    cardBuilder.addSection(
      CardService.newCardSection().addWidget(
        CardService.newTextParagraph().setText("<b>Negatif</b> 🙁")
      )
  )
  }

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
  var start = parseFloat(opts.startHour)
  var end = parseFloat(opts.endHour)
  Logger.log(opts)
  Logger.log(opts.startHour)

  var preferenceSection = CardService.newCardSection()
    .addWidget(
      createTimeSelectDropdown_("Start of day", "start", Math.floor(start))
    )
    .addWidget(
      hourQuarterSelectDropdown_("Minutes", "startMinute", start * 60 % 60) 
    )
    .addWidget(
      createTimeSelectDropdown_("End of day", "end", end / 60 % 60)
    )
    .addWidget(
      hourQuarterSelectDropdown_("Minutes", "endMinutes", Math.floor(end * 60 % 60))
    )
      
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
      .addButton(
        CardService.newTextButton()
          .setText("Grant")
          .setOnClickAction(createAction_("grantSmartDeconexion", {}))
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

function hourQuarterSelectDropdown_(label, name, defaultValue) {

  var roundedDefaultValue = Math.round(defaultValue / 15) * 15
  var widget = CardService.newSelectionInput()
    .setTitle(label)
    .setFieldName(name)
    .setType(CardService.SelectionInputType.DROPDOWN);

  for (var i = 0; i < 4; ++i) {
    var value = i * 15
    var text = value.toString()
    widget.addItem(text, value, value == roundedDefaultValue);
  }
  return widget;
}
