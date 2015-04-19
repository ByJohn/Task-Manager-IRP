/*
By John Evans
*/

$(function() {
	// < IE9
	if(!Modernizr.csstransforms) {
		alert('For the best experience, please use a more modern web browser, like Google Chrome or Mozilla Firefox.');
	}
});

/*------------------- Constant Variables -------------------*/

var ENTER_KEY = 13;
var ESC_KEY = 27;


/*------------------- Global Variables -------------------*/

var globals = {
	slideSpeed: 300
};


/*------------------- Global Functions -------------------*/

function formatTimestamp(timestamp) {
	return formatDate(timestamp) + ' - ' + formatTime(timestamp);
}

function formatDate(timestamp) {
	var m_names = [
			'January',
			'February',
			'March',
			'April',
			'May',
			'June',
			'July',
			'August',
			'September',
			'October',
			'November',
			'December'
		],
	d = new Date(timestamp * 1000);

	//return d.getDate() + ' ' + m_names[d.getMonth()] + ' ' + d.getFullYear();
	return addLeadingZero(d.getDate()) + '/' + addLeadingZero(d.getMonth() + 1) + '/' + d.getFullYear();
}

function formatTime(timestamp) {
	var d = new Date(timestamp * 1000);

	return d.getHours() + ':' + d.getMinutes();
}

//Date formatted as "YYYY-MM-DD". Returns object with time values
function getTimeUntilDate(date) {
	var today = moment().startOf('day'); //The start of the day today
	var future = moment(date);
	var duration = moment.duration(future.diff(today));

	var data = duration._data;
	data.wholeMilliseconds = duration._milliseconds;

	return data;
}

//Date formatted as "YYYY-MM-DD".
function getFormattedDeadline(date, addPrefix) {
	addPrefix = typeof addPrefix !== 'undefined' ? addPrefix : true;

	var dateData = getTimeUntilDate(date);
	var text = '';

	if(dateData.wholeMilliseconds >= 0) {
		if(addPrefix) text += 'is ';
		if(dateData.years > 0) text += 'in ' + dateData.years + ' year' + addSPlural(dateData.years);
		else if(dateData.months > 0) text += 'in ' + dateData.months + ' month' + addSPlural(dateData.months);
		else if(dateData.days > 1) text += 'in ' + dateData.days + ' day' + addSPlural(dateData.days);
		else if(dateData.days == 1) text += 'tomorrow';
		else if(dateData.days == 0 && dateData.wholeMilliseconds == 0) text += 'today';
	}
	else if(dateData.wholeMilliseconds < 0) {
		if(addPrefix) text += 'was ';
		if(dateData.years < 0) text += (dateData.years * -1) + ' year' + addSPlural((dateData.years * -1)) + ' ago';
		else if(dateData.months < 0) text += (dateData.months * -1) + ' month' + addSPlural((dateData.months * -1)) + ' ago';
		else if(dateData.days < -1) text += (dateData.days * -1) + ' day' + addSPlural((dateData.days * -1)) + ' ago';
		else if(dateData.days == -1) text += 'yesterday';
	}

	return text;
}

function addSPlural(num) {
	if(num < 1 || num > 1) return 's';
	return '';
}

function addLeadingZero(num) {
	return ('0' + num.toString()).slice(-2);
}

//Converts text into HTML-formatted text
function htmlifyText(text) {
	var newText = text;
	newText = newText.replace(/(?:\r\n|\r|\n)/g, '<br />'); //Replaces newlines with <br/> tags
	return newText;
}

function animateTypingTextContent($element) {
	var str = $element.html(),
	    i = 0,
	    isTag,
	    text;

	(function type() {
	    text = str.slice(0, ++i);
	    if (text === str) return;

	    $element.html(text);

	    var char = text.slice(-1);
	    if( char === '<' ) isTag = true;
	    if( char === '>' ) isTag = false;

	    if (isTag) return type();
	    setTimeout(type, 20);
	}());
}

//Based on http://stackoverflow.com/a/23202637/528423
function map(value, in_min , in_max , out_min , out_max ) {
	return ( value - in_min ) * ( out_max - out_min ) / ( in_max - in_min ) + out_min;
}


/*------------------- Document Ready -------------------*/

$(function() {
	$('.task-list').sortable({
		axis: 'y',
		stop: function(event, ui) {
			ui.item.trigger('drop', ui.item.index());
		}
	});
});








/*------------------- Tab Model -------------------*/

var Tab = Backbone.Model.extend({

	idAttribute: 'id',

	defaults: function() {
		return {
			'text': 'NewTab'
		};
	}

});


/*------------------- Tab Collection -------------------*/

var Tabs = Backbone.Collection.extend({

	model: Tab,
	localStorage: new Backbone.LocalStorage('task-manager-tabs')

});

var tabs = new Tabs();


/*------------------- Tab View -------------------*/

var TabView = Backbone.View.extend({

	tagName:  "li",
	className: 'tab no-select',

	template: _.template($('#tab-template').html()),

	events: {
		'click ' : 'changeTab',
		'dblclick label.text' : 'edit',
		'keydown input.text': 'textKeyDown',
		'blur input.text': 'textboxBlured',
		'submit form.edit' : 'updateTab',
		'mousedown .delete' : 'clear'
	},

	initialize: function() {
		this.listenTo(this.model, 'change', this.render);
		this.listenTo(this.model, 'destroy', this.remove);
		this.listenTo(this.model, 'remove', this.remove);
	},

	render: function() {
		var templateData = this.model.toJSON();

		this.$el.html(this.template(templateData));

		this.$el.attr('data-id', this.model.get('id'));

		this.input = this.$('input.text');

		return this;
	},

	edit: function() {
		this.$el.addClass("editing");
		this.input.focus().select();
	},

	updateTab: function(e) {
		if(typeof e !== 'undefined') e.preventDefault();

		var value = this.input.val();
		if (!value) {
			//this.clear();
		} else {
			this.model.save({text: value});
			this.$el.removeClass("editing");
		}
	},

	textKeyDown: function(e) {
		if (e.which === ESC_KEY) {
			this.$el.removeClass('editing');
			this.input.val(this.model.get('text')); // Also reset the hidden input back to the original value.
		}
	},

	textboxBlured: function () {
		this.updateTab();
	},

	clear: function(e) {
		e.preventDefault();

		if(this.model.collection.length > 1) {
			backup.createUndo('Tab and its tasks deleted');
			tasks.deleteModels( { 'tab': this.model.get('id') } );
			this.model.destroy();
		}
		else {
			toast.show('You cannot delete your last tab');
		}
	},

	changeTab: function() {
		if(tabsView.activeTab !== this.model.get('id')) {
			this.$el.parent().trigger('changeTab', this.model.get('id'));
		}
	}

});


/*------------------- Tabs View -------------------*/

var TabsView = Backbone.View.extend({

	el: $(".page-left .tabs"),

	events: {
		'click .create-tab' : 'createTab',
		'changeTab' : 'changeTab'
	},

	activeTab: null,
	$activeTab: null,

	initialize: function() {
		
		this.list = this.$el.find('.tab-list');

		this.listenTo(tabs, 'add', this.addOneAfter);
		this.listenTo(tabs, 'reset', this.addAll);
		this.listenTo(tabs, 'destroy', this.tabDestroyed);

		tabs.fetch({reset: true});

		if(tabs.length === 0) {
			tabs.create({text: 'Tasks'});
		}

		this.setToDefaultTab();
	},

	render: function() {
	},

	createTab: function() {
		tabs.create();
	},

	addOneBefore: function(model) {
		var view = new TabView({model: model});
		this.list.prepend(view.render().el);
	},

	addOneAfter: function(model) {
		var view = new TabView({model: model});
		this.list.append(view.render().el);
	},

	addAll: function() {
		this.list.html('');
		tabs.each(this.addOneAfter, this);
	},

	changeTab: function(e, tabID) {
		this.setActiveTab(tabID);
	},

	tabDestroyed: function(tabModel) {
		if(tabModel.get('id') === this.activeTab) this.setToDefaultTab();
	},

	setToDefaultTab: function() {
		this.setActiveTab(tabs.first().get('id'));
	},

	setActiveTab: function(tabID) {
		this.activeTab = tabID;
		this.$activeTab = this.list.find('.tab[data-id=' + tabID + ']');

		this.list.find('.tab').removeClass('active');
		this.$activeTab.addClass('active');

		this.$el.trigger('tabChanged', tabID);
	}
});
var tabsView = new TabsView();










/*------------------- Filters View -------------------*/

var Filters = Backbone.View.extend({

	el: $('.filters'),

	events: {
		'change select' : 'dropdownChanged',
		'change #unfiltered' : 'updateCheckbox',
	},

	status: null,
	deadline: null,

	initialize: function() {
		this.form = {};

		this.form = {
			status: this.$el.find('.filter-status'),
			deadline: this.$el.find('.filter-deadline'),
			showUnfiltered: this.$el.find('#unfiltered')
		};

		this.updateDropdownVars();
		this.updateCheckbox();
	},

	updateDropdownVars: function() {
		this.status = this.form.status.val();
		this.deadline = this.form.deadline.val();
	},

	dropdownChanged: function() {
		this.updateDropdownVars();
		this.$el.trigger('dropdownChanged');
	},

	updateCheckbox: function() {
		$('body').toggleClass('hide-unfiltered', !this.form.showUnfiltered.prop('checked'));
	}

});
var filters = new Filters();









/*------------------- Task Model -------------------*/

var Task = Backbone.Model.extend({

	idAttribute: 'id',

	defaults: function() {
		return {
			'text': 'New todo',
			'tab': tabsView.activeTab,
			'deadline': '',
			'created_time': Math.round(new Date().getTime() / 1000),
			'completed_time': -1,
			'order': 0
		};
	},

	initialize: function() {

	},

	toggle: function() {
		if(this.get('completed_time') == -1) {
			this.save({completed_time: Math.round(new Date().getTime() / 1000)})
		}
		else {
			this.save({completed_time: -1})
		}
	},

	hasDeadline: function() {
		if(this.get('deadline') == '') return false;
		else return true;
	},

	deadlineInFuture: function() {
		if(!this.hasDeadline()) return false;

		var today = moment().startOf('day'); //The start of the day today
		var taskDate = moment(this.get('deadline'));
		var duration = moment.duration(taskDate.diff(today));

		if(duration.asMilliseconds() > 0) return true;
		else return false;
	},

	deadlineInPast: function() {
		if(!this.hasDeadline()) return false;

		var today = moment().startOf('day'); //The start of the day today
		var taskDate = moment(this.get('deadline'));
		var duration = moment.duration(taskDate.diff(today));

		if(duration.asMilliseconds() < 0) return true;
		else return false;
	},

	deadlineToday: function() {
		if(!this.hasDeadline()) return false;

		var today = moment().startOf('day'); //The start of the day today
		var taskDate = moment(this.get('deadline'));
		var duration = moment.duration(taskDate.diff(today));

		if(duration.asMilliseconds() == 0) return true;
		else return false;
	},

	deadlineThisWeek: function() {
		if(!this.hasDeadline()) return false;

		var today = moment().startOf('isoweek'); //The start of the week today
		var taskDate = moment(this.get('deadline')).startOf('isoweek');
		var duration = moment.duration(taskDate.diff(today));

		if(duration.asMilliseconds() == 0) return true;
		else return false;
	},

	deadlineThisMonth: function() {
		if(!this.hasDeadline()) return false;

		var today = moment().startOf('month'); //The start of the month today
		var taskDate = moment(this.get('deadline')).startOf('month');
		var duration = moment.duration(taskDate.diff(today));

		if(duration.asMilliseconds() == 0) return true;
		else return false;
	}

});


/*------------------- Task Collection -------------------*/

var Tasks = Backbone.Collection.extend({

	model: Task,
	comparator: 'order',
	localStorage: new Backbone.LocalStorage('task-manager-tasks'),

	deleteModels: function(attr) {
		var models = this.where(attr);
		_.each(models, function(model) {
			model.destroy();
		});
		return this;
	}

});

var tasks = new Tasks();


/*------------------- Task View -------------------*/

var TaskView = Backbone.View.extend({

	tagName:  "li",
	className: 'task attributes-dropzone cf no-select',

	template: _.template($('#task-template').html()),

	events: {
		'click .toggle' : 'toggleDone',
		'dblclick label.text' : 'edit',
		'keydown input.text': 'textKeyDown',
		'blur input.text': 'textboxBlured',
		'submit form.edit' : 'updateTask',
		'mousedown .delete' : 'clear',

		'click .remove-deadline' : 'removeDeadline',

		'drop' : 'drop',
		'updateOrderValue' : 'updateOrderValue',

		'draggableDropped' : 'draggableDropped',
		'draggableEnter' : 'draggableEnter',
		'draggableLeave' : 'draggableLeave'
	},

	initialize: function() {
		this.listenTo(this.model, 'change', this.render);
		this.listenTo(this.model, 'destroy', this.remove);
		this.listenTo(this.model, 'remove', this.remove);
	},

	render: function() {
		this.done = false;
		if(this.model.get('completed_time') != -1) this.done = true;

		this.$el.attr('data-id', this.model.get('id'));

		this.$el.toggleClass('done', this.done);
		
		var templateData = this.model.toJSON();
		templateData.done = this.done;
		templateData.id = templateData.hasOwnProperty('id') ? templateData.id : 'No set';
		templateData.createdDate = formatDate(this.model.get('created_time'));
		templateData.createdTime = formatTime(this.model.get('created_time'));
		templateData.timeText = 'Created on ' + templateData.createdDate;
		templateData.timeTitle = templateData.createdDate + ' - ' + templateData.createdTime;

		if(this.model.get('deadline') != '') {
			templateData.deadlineData = {
				value: this.model.get('deadline'),
				fullDate: moment(this.model.get('deadline')).format('Do MMMM YYYY'),
				fullDate2: moment(this.model.get('deadline')).format('Do MMM YYYY'),
				till: 'Deadline ' + getFormattedDeadline(this.model.get('deadline'))
			};
			var duration = getTimeUntilDate(this.model.get('deadline'));
			var dayLimit = 14;
			var days = duration.days;
			if(days < 0) days = 0;
			if(days > dayLimit) days = dayLimit;

			templateData.deadlineData.barWidth = 100 - map(days, 0, dayLimit, 0, 100);
		}

		if(this.model.get('completed_time') > -1) {
			templateData.timeText = 'Completed on ' + formatDate(this.model.get('completed_time'));
			templateData.timeTitle = formatDate(this.model.get('completed_time')) + ' - ' + formatTime(this.model.get('completed_time'));
		}

		this.$el.html(this.template(templateData));

		this.input = this.$('input.text');
		this.$dropTipText = this.$('.drop-tip-text');

		return this;
	},

	toggleDone: function() {
		this.model.toggle();
	},

	edit: function() {
		this.$el.addClass("editing");
		this.input.focus();
	},

	updateTask: function(e) {
		if(typeof e !== 'undefined') e.preventDefault();

		var value = this.input.val();
		if (!value) {
			this.clear();
		} else {
			this.model.save({text: value});
			this.$el.removeClass("editing");
		}
	},

	removeDeadline: function() {
		backup.createUndo('Deadline removed');
		this.model.save({deadline: ''});
	},

	textKeyDown: function(e) {
		if (e.which === ESC_KEY) {
			this.$el.removeClass('editing');
			// Also reset the hidden input back to the original value.
			this.input.val(this.model.get('text'));
		}
	},

	textboxBlured: function () {
		this.updateTask();
	},

	clear: function() {
		backup.createUndo('Task deleted');
		var that = this;
		this.$el.velocity("slideUp", { duration: globals.slideSpeed, complete: function() {
			that.model.destroy();
		}});
	},


	drop: function(event, index) {
		if(this.$el.hasClass("editing")) {
			this.$('form.edit').submit(); //If the task is being edited and moved, save the task, so that its changes are saved
		}

		tasksView.updateOrderValues();
	},

	updateOrderValue: function(e, index) {
		if(this.model.get('order') != index) this.model.save('order', index);
	},

	
	//Temporarily store the data from the last draggable object to hover over this task. The temp data cleared when the draggable object leaves
	draggableEnter: function(e, dragEvent) {
		var $drag = $(dragEvent.relatedTarget);
		this.tempDropData = {
			type: $drag.attr('data-drop-type'),
			value: $drag.attr('data-drop-value')
		};

		var dropTipTextHTML = '';
		if(this.tempDropData.type === 'date') dropTipTextHTML = '+ <i class="fa fa-calendar"></i> &nbsp; Set deadline for ' + moment(this.tempDropData.value).format('dddd, Do MMMM YYYY') + ' (' + getFormattedDeadline(this.tempDropData.value, false) + ')';

		this.$dropTipText.html(dropTipTextHTML);
	},

	draggableLeave: function(e, dragEvent) {
		delete this.tempDropData;
		this.$dropTipText.html('');
	},

	draggableDropped: function(e, dragEvent) {
		if(typeof this.tempDropData !== 'undefined') {
			if(this.tempDropData.type === 'date') this.model.save({deadline: this.tempDropData.value});
			else if(this.tempDropData.type === 'tag') this.model.save({tags: this.model.get('tags').push(this.tempDropData.value)});
			
			delete this.tempDropData;
		}
	}

});


/*------------------- Tasks View -------------------*/
/* Basically the global view, centred on the task list */

var TasksView = Backbone.View.extend({

	el: $(".page"),

	events: {
		'submit .create-form' : 'createOnSubmit',
		'keyup .create-box' : 'textKeyUp',
		'click .clear' : 'clearTextbox',

		'tabChanged .tabs' : 'tabChanged',

		'dropdownChanged .filters': 'dropdownChanged'
	},

	initialize: function() {
		this.form = {};
		this.form.self = this.$el.find('form.create-form');

		this.form = {
			self: this.$el.find('form.create-form'),
			name: this.$el.find('.create-box'),
			submit: this.$el.find('input.submit')
		};

		this.list = this.$el.find('.task-list');
		this.tasksMessage = this.$el.find('.tasks-message');

		this.listenTo(tasks, 'add', this.addOneBefore);
		this.listenTo(tasks, 'reset', this.addAll);

		this.listenTo(tasks, 'add', this.softUpdateList);
		this.listenTo(tasks, 'destroy', this.softUpdateList);
		this.listenTo(tasks, 'change', this.softUpdateList);

		tasks.fetch({reset: true});
	},

	render: function() {
	},

	textKeyUp: function() {
		this.softUpdateList();

		if(this.form.name.val() == '') {
			this.form.self.removeClass('valid');
			this.form.submit.attr('disabled', 'disabled');
		}
		else {
			this.form.self.addClass('valid');
			this.form.submit.removeAttr('disabled');
		}
	},

	createOnSubmit: function(e) {
		e.preventDefault();
		this.createTask();
	},

	createTask: function() {
		if(this.form.name.val() != '') {
			tasks.create({text: this.form.name.val()});
			this.clearTextbox();
		}
	},

	clearTextbox: function() {
		this.form.name.val('');
	},


	setMessage: function(message, animate) {
		animate = typeof animate !== 'undefined' ? animate : false;
		this.tasksMessage.html(message);
		
		if(animate) animateTypingTextContent(this.tasksMessage); //Animates the test as if it was being typed
	},

	clearMessage: function() {
		this.setMessage('', false);
	},

	updateMessage: function() {
		this.clearMessage();
		var messageText = '';

		if(this.form.name.val() != '' || filters.status > 0 || filters.deadline > 0) {
			if(this.form.name.val() != '') {
				messageText += 'Matches for <strong>' + this.form.name.val() + '</strong>. ';
			}

			if(filters.status > 0 || filters.deadline > 0) {
				messageText += 'Filtered by ';
				if(filters.status == 1) messageText += '<strong>uncompleted tasks</strong>'
				if(filters.status == 2) messageText += '<strong>completed tasks</strong>'

				if(filters.status > 0 && filters.deadline > 0) messageText += ' with ';
				else if(filters.status > 0 && filters.deadline == 0) messageText += '. ';

				if(filters.deadline == 1) messageText += '<strong>future deadlines</strong>.';
				if(filters.deadline == 2) messageText += 'deadlines <strong>today</strong>.';
				if(filters.deadline == 3) messageText += 'deadlines <strong>this week</strong>.';
				if(filters.deadline == 4) messageText += 'deadlines <strong>this month</strong>.';
				if(filters.deadline == 5) messageText += '<strong>passed deadlines</strong>.';
				if(filters.deadline == 6) messageText += '<strong>no deadline</strong>.';
			}

		}

		if(this.getSearchAndFilteredTasks().length === 0) messageText += '<br>No tasks found.';
		
		this.setMessage(messageText);
	},


	//Updates the message and the tasks displayed by filters and search. Noting permanent
	softUpdateList: function(options) {
		options = _.extend({}, {
			animate: false //Animations are a little buggy. Changing the filter, they all disappear and slideDown
		}, options);
		this.applyFiltersAndSearch(options);
		this.updateMessage(options);
	},

	//Gets all tasks on the current tab
	getAll: function() {
		return tasks.where({'tab': tabsView.activeTab});
	},


	addOneBefore: function(todo) {
		var view = new TaskView({model: todo});
		this.list.prepend(view.render().el);

		this.updateOrderValues();

		view.$el
		.hide()
		.velocity("slideDown", { duration: globals.slideSpeed });
	},

	addOneAfter: function(todo) {
		var view = new TaskView({model: todo});
		this.list.append(view.render().el);
	},

	addAll: function(animate) {
		animate = typeof animate !== 'undefined' ? animate : false;

		this.list.html(''); //Clear list
		this.clearMessage();

		var foundTasks = this.getAll();

		if(foundTasks.length > 0) {
			_.each(foundTasks, this.addOneAfter, this);

			this.$el.find('.task-list .task')
			.css({'display': 'none'})
			.velocity("transition.slideUpIn", { duration: globals.slideSpeed, stagger: 40 });
		}

		this.softUpdateList();
	},


	dropdownChanged: function() {
		this.softUpdateList();
	},

	//Gets all tasks on the current tab (via getAll()) and with the current search and filters
	getSearchAndFilteredTasks: function() {
		var filteredTasks = this.getAll(),
			status = filters.status,
			deadline = filters.deadline,
			searchText = this.form.name.val();

		if(searchText.length) {
			filteredTasks = _.filter(filteredTasks, function (task) {
				var str = task.get('text').toLowerCase(),
					pattern = searchText.toLowerCase();
				pattern = pattern.split("").reduce(function(a,b){ return a+".*"+b; });
				return (new RegExp(pattern)).test(str);
			});
		}


		if(status == 1) {
			filteredTasks = _.filter(filteredTasks, function (task) {
				return task.get('completed_time') == -1;
			});
		}
		else if(status == 2) {
			filteredTasks = _.filter(filteredTasks, function (task) {
				return task.get('completed_time') > -1;
			});
		}


		if(deadline == 1) {
			filteredTasks = _.filter(filteredTasks, function (task) {
				return task.deadlineInFuture();
			});
		}
		else if(deadline == 2) {
			filteredTasks = _.filter(filteredTasks, function (task) {
				return task.deadlineToday();
			});
		}
		else if(deadline == 3) {
			filteredTasks = _.filter(filteredTasks, function (task) {
				return task.deadlineThisWeek();
			});
		}
		else if(deadline == 4) {
			filteredTasks = _.filter(filteredTasks, function (task) {
				return task.deadlineThisMonth();
			});
		}
		else if(deadline == 5) {
			filteredTasks = _.filter(filteredTasks, function (task) {
				return task.deadlineInPast();
			});
		}
		else if(deadline == 6) {
			filteredTasks = _.filter(filteredTasks, function (task) {
				return !task.hasDeadline();
			});
		}


		return filteredTasks;
	},

	applyFiltersAndSearch: function(options) {
		var status = filters.status,
			deadline = filters.deadline;

		$('.task-list .task:not(.ui-sortable-placeholder)').each(function() {
			var $el = $(this);
			$el.removeClass('filtered');

			if(options.animate) $el.slideDown(globals.slideSpeed * 2);
		});
			

		if(status == 0 && deadline == 0 && this.form.name.val() == '') {
			this.list.removeClass('filtered-list');
		}
		else {
			if(!options.animate) this.list.addClass('filtered-list');

			_.each(this.getSearchAndFilteredTasks(), function(task) {
				$('.task-list .task[data-id="' + task.get('id') + '"]')
					.addClass('filtered');
			});

			$('.task-list .task:not(.filtered)').each(function() {
				var $el = $(this);

				if(options.animate) $el.slideUp(globals.slideSpeed * 2);
			});
		}

	},


	updateOrderValues: function() {
		$('.task-list .task:not(.ui-sortable-placeholder)').each(function(i) {
			var el = $(this);
			el.trigger('updateOrderValue', [i]);
		});

		tasks.sort();
	},


	tabChanged: function(e, tabID) {
		this.addAll(true);
	}
	
});

var tasksView = new TasksView();








/*------------------- Calendar View -------------------*/

var CalendarView = Backbone.View.extend({

	el: $(".calendar"),

	events: {
		
	},

	initialize: function() {
		var template = _.template($('#date-template').html());

		this.$el.fullCalendar({
			contentHeight: 'auto',
			fixedWeekCount: false,
			firstDay: 1,
			// dayNamesShort: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
			dayRender: function(date, cell) {
				var $c = $(cell);
				var templateData = {
					dateFormat: date.format(),
					fullDate: date.format('Do MMMM YYYY'),
					day: date.format('D')
				};
				$c.html(template(templateData));
			}
		});
	},

	render: function() {
	}

});

var calendar = new CalendarView();





/*------------------- Drag and Drop View -------------------*/

var DragAndDropView = Backbone.View.extend({

	events: {
		
	},

	initialize: function() {
		interact('.draggable').draggable({
			inertia: true,
			restrict: {
				restriction: 'parent',
				endOnly: true,
				elementRect: { left: 0, right: 1, top: 0, bottom: 1 }
			},

			onstart: function(event) {
				$(event.target).addClass('dragging');
			},

			onmove: function (event) {
				var target = event.target,
				x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx,
				y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

				target.style.webkitTransform =
				target.style.transform =
				'translate(' + x + 'px, ' + y + 'px)';

				target.setAttribute('data-x', x);
				target.setAttribute('data-y', y);
			},

			onend: function (event) {
				var target = event.target,
					$target = $(target);

				$target.removeClass('dragging');
			},

			oninertiastart: function(event) {
				$('.task-list .task').trigger('draggableDropped', event);
			}
		});

		interact('.attributes-dropzone').dropzone({
			accept: '.draggable',
			overlap: 0.5,

			ondropactivate: function (event) {
				event.target.classList.add('drop-active');
			},

			ondropdeactivate: function (event) {
				event.target.classList.remove('drop-active');
				event.target.classList.remove('drop-target');
			},

			ondragenter: function (event) {
				var draggableElement = event.relatedTarget,
				dropzoneElement = event.target;

				dropzoneElement.classList.add('drop-target');
				draggableElement.classList.add('can-drop');

				$(event.target).trigger('draggableEnter', event);
			},

			ondragleave: function (event) {
				event.target.classList.remove('drop-target');
				event.relatedTarget.classList.remove('can-drop');

				$(event.target).trigger('draggableLeave', event);
			},

			//Does not fire when dragging inertia is enabled
			ondrop: function (event) {
			}
		});
	}

});

var dragDrop = new DragAndDropView();








/*------------------- Data Backup -------------------*/

var backup = {

	data: {
		tabs: null,
		tasks: null
	},

	createUndo: function(message) {
		this.save();
		toast.show(message + '. <a href="javascript:void(0)" onclick="backup.load();">Undo <i class="fa fa-undo"></i></a>', 5000);
	},

	save: function() {
		this.data.tabs = new Backbone.Collection(tabs.toJSON());
		this.data.tasks = new Backbone.Collection(tasks.toJSON());
	},

	load: function() {
		if(this.data.tabs !== null && this.data.tasks !== null) {
			//Clears the local storage
			tabs.localStorage._clear();
			tasks.localStorage._clear();

			//Resets the collections with the previous data
			tabs.reset(this.data.tabs.toJSON());
			tasks.reset(this.data.tasks.toJSON());

			//Forces a write to local storage
			tabs.invoke('save');
			tasks.invoke('save');

			tabsView.setActiveTab(tabsView.activeTab);
		}
		else {
			console.debug('Backup data is null: ', this.data);
		}
	}
};







/*------------------- Toast View -------------------*/

var ToastView = Backbone.View.extend({

	el: $(".toast"),

	events: {
		'mouseenter .toast-box' : 'hovered',
		'mouseleave .toast-box' : 'unhovered',
		'click .toast-box' : 'hide',
	},

	initialize: function() {
		this.box = this.$el.find('.toast-box');
		this.hide();
	},

	clearHideTimer: function() {
		if(typeof this.hideTimer == "number") {
			clearTimeout(this.hideTimer);
			delete this.hideTimer;
		}
	},

	show: function(html, timeout) {
		timeout = typeof timeout !== 'undefined' ? timeout : 3000;

		this.hide();

		this.box.html(html);

		this.box.css({'top': -this.box.outerHeight()}).show().animate({'top': '0'}, globals.slideSpeed);

		var that = this;
		this.hideTimer = setTimeout(function() {
			that.fadeOut();
		}, timeout);
	},

	fadeOut: function() {
		var that = this;
		this.box.animate({'opacity': '0'}, 1000, function() {
			that.hide();
		});
	},

	hide: function() {
		this.clearHideTimer();
		this.box.stop(true).css({'top': '-100%', 'display': 'none', 'opacity': 1});

		this.box.html('');
	},

	hovered: function(e) {
		this.clearHideTimer();
		this.box.stop(true).css({'top': '0', 'display': 'block', 'opacity': 1});
	},

	unhovered: function(e) {
		this.fadeOut();
	}
});

var toast = new ToastView();