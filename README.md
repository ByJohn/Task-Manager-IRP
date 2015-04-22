# Task Manager IRP

A task management web application built for my Individual Research Project at the University of Gloucestershire.

SSL files (cert.pem & key.pem) are dummy, non-production files used for local testing over https using [http-server-basicauth-ssl](https://www.npmjs.com/package/http-server-basicauth-ssl) Node package.

##To-do

- Make fully responsive
- Use package manager (NPM/Bower?) for third party dependencies (in vendor folder)
- Change to dropdown that has options for "hidden" and "faded"
- Add "delete all completed tasks" button
- A empty data messages (eg "All tasks completed, awesome!")
- Fix height issue with overlflow scroll on task list on short screens
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