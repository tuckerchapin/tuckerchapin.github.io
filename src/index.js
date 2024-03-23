const marked = require("marked").marked
console.log('Hello, world!')
console.log("marked", await marked("I am using __markdown__."))
console.log('hmm thats weird that it exited')