var pastSavedAnswers = {}

var sleep = function (ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

var startSolving = async function () {
  await sleep(2000)
  while (true) {
    try {
      await sleep(250) // Wait for the page to open properly
      const question = await parseQuestion()
      await answerQuestion(question)
    } catch (e) {
      console.log('Error')
    }
  }
}

// Returns the state of the question (pending or answered)
var getQuestionState = function () {
  var element = document.querySelector('.probe-header')

  var header = element.innerText
  if (header.includes('Your Answer')) return 'ANSWERED'
  else return 'PENDING'
}

// Returns true if answer is correct and false if incorrect
var isAnswerCorrect = function () {
  var header = document.querySelector('.probe-header').innerText
  if (header.includes('Your Answer incorrect')) return false
  else if (header.includes('Your Answer correct')) return true
}

// Parses the question and returns an object
var parseQuestion = async function () {
  var type = document.querySelector('.probe-header').innerText
  var prompt = document
    .querySelector('.prompt')
    .innerText.split('\n')
    .map((x) => x.trim())
    .filter(Boolean)
    .join(' ')
  var clutter = prompt.substring(
    prompt.lastIndexOf(' \n') + 1,
    prompt.lastIndexOf('\n ') + 1,
  )
  prompt
    .split(clutter)
    .map((x) => x.trim())
    .join(' ')
  return { type, prompt }
}

var answerQuestion = async function (question) {
  // somehow comprehend the answer and answer based on fill in the blanks, drag drop etc
  // probably need subfunctions
  var type = question.type
  var state = getQuestionState() //PENDING or ANSWERED

  if (state == 'PENDING') {
    var solution = pastSavedAnswers[question.prompt]
    console.log(solution)

    if (type == 'Multiple Choice Question' || type.includes('True or False')) {
      answerMCQ(solution)
    } else if (type == 'Multiple Select Question') {
      answerMSQ(solution)
    } else {
      if (solution != undefined) {
        alert(solution)
      }
      await waitForAnswer(question)
    }
    state = 'ANSWERED'
    await sleep(250)
  }

  if (state == 'ANSWERED') {
    var high = await getSpecificButton('High')
    if (high) high.click()
    await sleep(250)
    await saveAnswer(question)
    await goToNextQuestion()
  }
}

var answerMCQ = function (solution) {
  if (solution != undefined) {
    var options = document.querySelectorAll('.choice-row')
    for (var i = 0; i < options.length; i++) {
      value = options[i].innerText
      if (solution.includes(value)) {
        options[i].children[0].children[0].click()
        return
      }
    }
  } else {
    var options = document.querySelectorAll('.choice-row')
    var random = Math.floor(Math.random() * options.length)
    options[random].children[0].children[0].click()
  }
}

var answerMSQ = function (solution) {
  if (solution != undefined) {
    var options = document.querySelectorAll('.choice-row')
    for (var i = 0; i < options.length; i++) {
      value = options[i].innerText
      if (solution.includes(value)) {
        options[i].children[0].children[0].click()
      }
    }
  } else {
    var options = document.querySelectorAll('.choice-row')
    for (var i = 0; i < options.length - 1; i++) {
      var random = Math.floor(Math.random() * options.length)
      options[random].children[0].children[0].click()
    }
  }
}

var waitForAnswer = async function () {
  while (getQuestionState() == 'PENDING') {
    await sleep(600)
  }
}

// Actions

var goToNextQuestion = async function () {
  var nextQuestionButton = await getSpecificButton('Next Question')
  if (nextQuestionButton.disabled) {
    await visitTextBookAndReset()
  }
  var nextQuestionButton = await getSpecificButton('Next Question')
  if (nextQuestionButton) nextQuestionButton.click()
}

var visitTextBookAndReset = async function () {
  var textbookButton = await getSpecificButton('Read About the Concept')
  textbookButton.click()
  await sleep(250)
  var returnButton = await getSpecificButton('To Questions')
  returnButton.click()
}

var resetQuestion = function () {
  location.reload()
}

// Cloud data storage

var saveAnswer = async function (question) {
  var answers = []
  if (question.type.includes('Fill in the Blank'))
    document
      .querySelectorAll('.correct-answers')
      .forEach((answer) => answers.push(answer.innerText))
  else if (
    question.type.includes('Multiple') ||
    question.type.includes('True or False')
  )
    answers = document
      .querySelector('.answer-container')
      .innerText.split('\n')
      .filter(Boolean)
  else {
    var options = document.querySelector('.correct-list').children
    for (var i = 0; i < options.length; i++) {
      var match = options[i]
      var def = match.children[0].innerText
      var value = match.children[2].innerText.split('\n')[0]
      answers.push(def + ' --> ' + value)
    }
  }
  pastSavedAnswers[question.prompt] = answers
}

//Get specific / helper functions

var getSpecificButton = async function (buttonText) {
  var buttons = document.querySelectorAll('button')
  for (let i = 0, len = buttons.length; i < len; i++) {
    if (buttons[i].innerText.includes(buttonText)) {
      return buttons[i]
    }
  }
}

//If accessing via blackboard
if (
  window.location.href.includes('https://lms.mheducation.com/mghmiddleware')
) {
  sleep(3000).then(() => {
    if (
      document.querySelector('#ezt_assignment_category_e').innerText ==
      'SmartBook 2.0'
    ) {
      getSpecificButton('Begin').then((button) => button.click())
    }
  })
}

//If reaches the start page!
else if (window.location.href.includes('https://learning.mheducation.com')) {
  sleep(3000).then(() => {
    if (document.querySelector('.welcome-learn__heading') != null) {
      document.querySelector('.welcome-learn__heading').innerText =
        'Welcome home Cheater!'
    }
    let elements = document.getElementsByTagName('button')
    for (let i = 0, len = elements.length; i < len; i++) {
      if (
        elements[i].innerText == 'Continue Questions' ||
        elements[i].innerText == 'Start Questions'
      ) {
        var continueButton = elements[i]
        continueButton.click()
        startSolving()
      }
    }
    startSolving()
  })
}
