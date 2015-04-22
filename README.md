# Task Manager IRP

A task management web application built for my Individual Research Project at the University of Gloucestershire.

##Demo

[www.byjohn.github.io/task-manager-irp](https://byjohn.github.io/task-manager-irp/)

##Voice Input

This application uses the [Web Speech API](https://dvcs.w3.org/hg/speech-api/raw-file/tip/speechapi.html) to handle voice input of tasks. At the time of writing, this API is only available in Google Chrome and will only work continuously on HTTPS.

##To-do

- Change to dropdown that has options for "hidden" and "faded"
- Add "delete all completed tasks" button
- A empty data messages (eg "All tasks completed, awesome!")
- Fix height issue with overflow scroll on task list on short screens
- Make fully responsive
- Use package manager (NPM/Bower?) for third party dependencies (in vendor folder)
- Modularize the JavaScript into multiple files to make it more manageable
- Comment code
- Tabs
	- Add reorder functionality
- Undo function
	- Prevent undo once any change has been made to a collections
- Deadline task attribute
	- Update calendar when deadlines and tasks are added/removed from tasks on the current tab, or when the tab is changed
	- Add deadline time (hours)
	- Hover over dates to highlight tasks with that deadline
- Add custom (colour) tags
	- Add
		- Text
		- Colour
	- Edit
	- Delete and remove all references on tasks
	- Drag onto tasks
	- Reorder
- Add drag and drop task creation
	- Add files to existing tasks


Please note: SSL files (cert.pem & key.pem) are dummy, non-production files generated for local testing over HTTPS using the [http-server-basicauth-ssl](https://www.npmjs.com/package/http-server-basicauth-ssl) Node package.