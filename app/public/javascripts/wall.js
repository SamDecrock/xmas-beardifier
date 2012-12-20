App = {
	timervalue: 30000,
	timer: null,
	counter: 0,

	picturesInCache:{},

	start: function (){
		App.moustacheCollection = new App.MoustacheCollection();
		App.articlelistView = new App.ArticlelistView();

		// socket.io initialiseren
		App.socket = io.connect(window.location.hostname);

		// Add ourselves to the 'wall' room
		App.socket.on('connect', function() {
			App.socket.emit('room', 'wall');
		});

		App.socket.on('wall.newpicture', function (data) {
			App.picturesInCache[data.id] = data.picture; //bewaren om sneller te laden straks
		});

		App.socket.on('wall.publish', function (data) {
			var articleModel = new App.ArticleModel({
				title: data.title,
				picture:  App.picturesInCache[data.id]
			});


			// timer uitzetten
			if(App.timer) clearTimeout(App.timer);

			// niewe foto renderen (wordt automatisch gerender bij toevoegen aan collection):
			App.moustacheCollection.add(articleModel);

			// timer weer aansteken
			App.timer = setTimeout(App.autoSlide, App.timervalue);
		});
	},

	doSlide: function(){
		var firstarticle = $('.article').first();
		firstarticle.css('width', '0px');
		setTimeout(function(){
			firstarticle.remove();
		},1000);
	},

	autoSlide: function (){
		if(App.moustacheCollection.length > 1 && App.counter < App.moustacheCollection.length){
			App.articlelistView.renderItem(App.moustacheCollection.at(App.counter));

			App.counter++;
		}

		// counter resetten:
		if(App.counter >= App.moustacheCollection.length){
			App.counter = 0;
		}

		// timer weer aansteken
		App.timer = setTimeout(App.autoSlide, App.timervalue);
	}
};


// Backbone list view
App.ArticlelistView = Backbone.View.extend({
	el: "#articles",

	initialize: function(){
		App.moustacheCollection.bind("add", this.renderItem, this);
	},

	renderItem: function(model){
		var self = this;

		// image preloaden:
		var imageObject = new Image();
		imageObject.src = model.get("picture");
		// article pas tonen als image gepreload is:
		imageObject.onload = function(){
			var articleView = new App.ArticleView({model: model});
			var renderedArticle = articleView.render().el;
			$(self.el).append(renderedArticle);
			App.doSlide();
		}
	}
});

//Backbone View:
App.ArticleView = Backbone.View.extend({
	tagName: "div",
	className: "article",

	initialize: function(){
		this.template = $("#article-template");
	},

	render: function(){
		var html = this.template.tmpl(this.model.toJSON());
		$(this.el).html(html);
		return this;
	}
});

//Backbone Model:
App.ArticleModel = Backbone.Model.extend({
});

// Backbone Collection
App.MoustacheCollection = Backbone.Collection.extend({
	model: App.ArticleModel
});


$(App.start);