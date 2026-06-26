const Language = Object.freeze({
  CPP: { 
    id: 54, 
    name: 'C++', 
    extension: '.cpp',
    dockerImage: 'gcc:alpine',
    compileCmd: 'g++ -O2 -o main main.cpp',
    runCmd: './main'
  },
  JAVA: { 
    id: 62, 
    name: 'Java', 
    extension: '.java',
    dockerImage: 'openjdk:11-jdk-slim',
    compileCmd: 'javac Main.java',
    runCmd: 'java Main'
  },
  PYTHON: { 
    id: 71, 
    name: 'Python 3', 
    extension: '.py',
    dockerImage: 'python:3-alpine',
    compileCmd: null, // Python is interpreted
    runCmd: 'python3 main.py'
  },
  JAVASCRIPT: { 
    id: 93, 
    name: 'Node.js', 
    extension: '.js',
    dockerImage: 'node:20-alpine',
    compileCmd: null,
    runCmd: 'node main.js'
  }
});

export default Language;