# identify-node-leaks
A project that can be used to monitor code in terms of memory leaks.

## Requirements
Create a module (you want to monitor) in the `modules` folder, which has a property `test` and a property `getMemDump`:
  - `test`: a function which will be called by the harness (index.js) in a certain interval
  - `getMemDump`: a function which will be called after an `uncaughtException` happened in order to print one last memory dump which can then be analyzed

## Usage

    nodejs index.js [modulename in modules folder] [interval in seconds]

## Example output

![Image of a memory usage graph](https://raw.githubusercontent.com/dominicbosch/identify-node-leaks/master/graphs/Scripts_started_6.7.2015.png)
