const marked = require("marked").marked
console.log('Hello, world!')
const markdown = await marked("I am using __markdown__.");
console.log("marked", markdown)
console.log('hmm thats weird that it exited')