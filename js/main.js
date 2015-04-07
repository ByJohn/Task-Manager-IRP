/*
By John Evans
*/

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
		'submit form.edit' : 'updateTab',
		'click .delete' : 'clear'
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
		e.preventDefault()

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

	clear: function() {
		if(this.model.collection.length > 1) {
			tasks.deleteModels( { 'tab': this.model.get('id') } );
			this.model.destroy();
		}
		else {
			alert('You cannot delete your last tab');
		}
	},

	changeTab: function() {
		if(tabsView.activeTab !== this.model.get('id')) {
			this.$el.parent().trigger('changeTab', this.model);
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

	changeTab: function(e, tabModel) {
		this.setActiveTab(tabModel);
	},

	tabDestroyed: function(tabModel) {
		if(tabModel.get('id') === this.activeTab) this.setToDefaultTab();
	},

	setToDefaultTab: function() {
		this.setActiveTab(tabs.first());
	},

	setActiveTab: function(tabModel) {
		var id = tabModel.get('id');
		this.activeTab = id;
		this.$activeTab = this.list.find('.tab[data-id=' + id + ']');

		this.list.find('.tab').removeClass('active');
		this.$activeTab.addClass('active');

		this.$el.trigger('tabChanged', id);
	}
});
var tabsView = new TabsView();










/*------------------- FIlters View -------------------*/

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
	className: 'task cf no-select',

	template: _.template($('#task-template').html()),

	events: {
		'click .toggle' : 'toggleDone',
		'dblclick label.text' : 'edit',
		'keydown input.text': 'textKeyDown',
		'submit form.edit' : 'updateTask',
		'click .delete' : 'clear',

		'drop' : 'drop',
		'updateOrderValue' : 'updateOrderValue'
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

		if(this.model.get('completed_time') > -1) {
			templateData.timeText = 'Completed on ' + formatDate(this.model.get('completed_time'));
			templateData.timeTitle = formatDate(this.model.get('completed_time')) + ' - ' + formatTime(this.model.get('completed_time'));
		}

		this.$el.html(this.template(templateData));

		this.input = this.$('input.text');

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
		e.preventDefault()

		var value = this.input.val();
		if (!value) {
			this.clear();
		} else {
			this.model.save({text: value});
			this.$el.removeClass("editing");
		}
	},

	textKeyDown: function(e) {
		if (e.which === ESC_KEY) {
			this.$el.removeClass('editing');
			// Also reset the hidden input back to the original value.
			this.input.val(this.model.get('text'));
		}
	},

	clear: function() {
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

	//Gets all tasks on the current tab with the current filters
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

		// console.log('add all in', tabsView.activeTab, foundTasks);
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





/*------------------- Data Backup -------------------*/

var backup = {

	data: {
		tabs: null,
		tasks: null
	},

	save: function() {
		this.data.tabs = new Backbone.Collection(tabs.toJSON());
		this.data.tasks = new Backbone.Collection(tasks.toJSON());
	},

	load: function() {
		//Clears the local storage
		tabs.localStorage._clear();
		tasks.localStorage._clear();

		//Resets the collections with the previous data
		tabs.reset(this.data.tabs.toJSON());
		tasks.reset(this.data.tasks.toJSON());

		//Forces a write to local storage
		tabs.invoke('save');
		tasks.invoke('save');
	}
};