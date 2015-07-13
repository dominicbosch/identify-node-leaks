# identify-node-leaks
A project to monitor nodejs code in terms of memory consumption.

## Requirements
Create a module (you want to monitor) in the `modules` folder, which has a property `test` and a property `getMemDump`:
  - `test`: a function which will be called by the harness (index.js) in a certain interval
  - `getMemDump`: a function which will be called after an `uncaughtException` happened in order to print one last memory dump which can then be analyzed

## Usage

1. Run code to monitor:

        nodejs index.js [modulename in modules folder] [interval in seconds]

2. Run webserver:

        nodejs serveHistogram.js

  This will give you the port on which the server is listening to show you the memory graph:

        $ server listening on port 9876

3. Convert measurment data:

  Since most likely there will be a lot of measurements points, you need to convert the measurements data from time to time in order for the web application to respond fast enough when making a different selection. In order to transform the measurements into chunks as a histogram does it, type:

        node chunkit.js
        
  This will create files for three dimensions of the data, thus drastically reducing loading times for large measurements:
  
    - measurement point: `before` and `after` execution of the script to be monitored (after might likely be in the middle of work)
    - chunk sizes: `[0.25, 0.5, 1, 3, 6, 12, 24]` hours of averaged data
    - metric: `['rss', 'heapTotal', 'heapUsed', 'diffRSSAndTotal']`, refer to the returned values of  [NodeJS's process.memoryUsage()](https://nodejs.org/api/process.html#process_process_memoryusage)


## Example output

![Image of a memory usage graph](https://raw.githubusercontent.com/dominicbosch/identify-node-leaks/master/graphs/Scripts_started_6.7.2015.png)
