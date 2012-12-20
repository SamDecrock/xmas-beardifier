
App = {

	id: null,

	start: function () {

		// socket.io initialiseren
		App.socket = io.connect(window.location.hostname);

		// Add ourselves to the 'controller' room
		App.socket.on('connect', function() {
			App.socket.emit('room', 'controller');
		});

		App.people =  new App.People();
		App.peopleListView = new App.PeopleListView();


		App.socket.on('controller.originalpicture', function (data) {
			App.people.add(data);
		});
	}
}


App.PeopleListView = Backbone.View.extend({
	el: "#people",

	initialize: function(){
		App.people.bind("add", this.renderItem, this);
		App.people.bind("reset", this.renderAll, this);
	},

	renderItem: function(model){
		var personView = new App.PersonView({model: model});
		$(this.el).append(personView.render().el);
	},

	renderAll: function(collection){
		collection.forEach(this.renderItem, this);
	}
});

App.PersonView = Backbone.View.extend({
	tagName: "li",

	events:{
		'click #send': 'sendname'
	},

	initialize: function(){
		this.template = $("#personview-template");
		this.model.bind('remove', this.removeHandler, this);
	},

	render: function(){
		var html = this.template.tmpl(this.model.toJSON());
		$(this.el).html(html);
		return this;
	},

	sendname: function(event){
		App.socket.emit('controller.sendname', {
			id: this.model.id,
			name: this.$("#name").val()
		});
		App.people.remove(this.model);
	},

	removeHandler: function(model){
		this.remove();
	}
});

//Backbone Model:
App.Person = Backbone.Model.extend({
});

// Backbone Collection
App.People = Backbone.Collection.extend({
	model: App.Person
});


$(App.start);