App = {
	picturesInCache:{},
	offsetLeft: 0,

	randomArticles:[
		{
			title: "iMinds/Bell Labs Open Day joint plenary: Wim De Waele, Markus Hofmann, Andrew Keen",
			time: "9:00 - 10:30",
			image: "images/wimdewaele.jpg",
			content: "Wim De Waele is Chief Executive Officer of iMinds, headquartered in Ghent, Belgium. iMinds specializes in interdisciplinary research and development in the software sector, working with companies and other partners on the newest technologies in domains such as networking, media, security and healthcare.<br />Besides his general management duties, he  also leads the market strategy and incubation efforts of iMinds with strong focus on the development of new start-up companies and business acceleration of technology concepts.",
			width: 215

		},
		{
			title: "MiXing things up: should content be a freebie?",
			time: "11:00 - 12:30",
			image: "images/mix.png",
			content: 'The path to Tomorrow\'s Media is studded with questions, doubt, and also fear of the unknown. Each issue evokes a multitude of new questions and uncertainties. Who knows what media consumption will look like in the future? Who knows whether content will maintain its value? And especially; how will it be valorized? What does "online freedom" mean? We kindly invite you to listen to two outspoken opinions on that future. Two passionate people delivering two diverging views. No questions, but answers!',
			width: 215
		},
		{
			title: "Jim McKelvey: Square",
			time: "14:00 - 14:30",
			image: "images/jimmckelvey2.jpg",
			content: "This year Jim McKelvey will be speaking at iMinds. Jim McKelvey is an American computer science engineer and businessperson widely known as the co-founder of Square, a mobile payments company. Square is an electronic payment service, provided by Square Inc. Square allows users in the United States to accept credit cards through their mobile phones, either by swiping the card on the Square device or by manually entering the details on the phone.",
			width: 215
		}
	],
	timeouthandle:'',
	timeouthandle2:'',
	counter: 0,
	slidenumber: 1,
	timeoutvalue: 30000,
	showingtwitter: false,
	start: function (){
		console.log("hello world");



		App.articleCollection = new App.ArticleCollection();
		App.tweetsCollection = new App.TweetsCollection();
		App.articlelistView = new App.ArticlelistView();
		// TOCH MAAR NIET; beter voor carrousel
		// check for checkbox changes
		// var twitterbox = $('input:checkbox[name=twitter]');
		// twitterbox.click(function() {
		// 	var checked = false;
		// 	if(twitterbox.attr('checked'))
		// 		checked = true;
		// 	$.post("/rest/showtwitterfeed", {checked: checked});

		// });

		// socket.io initialiseren
		App.socket = io.connect(window.location.hostname);

		// doorgeven dat we de wall zijn
		App.socket.emit('wall.ping', {});
		App.socket.on('reconnect', function(){
			App.socket.emit('wall.ping', {});
		});

		App.socket.on('wall.newpicture', function (data) {
			App.picturesInCache[data.id] = data.picture; //bewaren om sneller te laden straks
		});

		App.socket.on('wall.publish', function (data) {
			var articleModel = new App.ArticleModel({
				twittername: data.twittername,
				picture:  App.picturesInCache[data.id], //terug ophalen
				subtitle: data.subtitle,
				tweets: data.tweets
			});
			if(App.timeouthandle) clearTimeout(App.timeouthandle);
			if(App.timeouthandle2) clearTimeout(App.timeouthandle2);
			App.counter = 0;
			App.slidenumber = 1;
			App.timeouthandle2= setTimeout(App.rotateStuff, App.timeoutvalue);

			App.articleCollection.add(articleModel);
		});

		App.socket.on('wall.showtweets', function (data) {
			var tweetsModel = new App.TweetsModel({
				searchterm: data.searchterm,
				tweets: data.tweets
			});

			App.tweetsCollection.add(tweetsModel);
		});

		App.socket.on('wall.newtweet', function (data) {
			var thetemplate= $("#singletweetpl");
			var html = thetemplate.tmpl(data);
			html.prependTo($(".bigtweets").last());
		});
		// make urls work -- NO
		// $("a[title='moust']").click(function(){
		// 	if(App.articleCollection.length>0){
		// 		var lastphoto = App.articleCollection.last();
		// 		App.articlelistView.renterPicture(lastphoto);
		// 	}
		// });

	},

	rotateStuff: function(){
		var twitterbox = $('input:checkbox[name=twitter]');
		var moustachebox = $('input:checkbox[name=moustache]');
		var mixbox = $('input:checkbox[name=mix]');
		// laatste foto's opnieuw tonen
		if(moustachebox.attr('checked'))
		{
			if(App.articleCollection.length>1 && App.counter<App.articleCollection.length){
				App.articlelistView.renterPicture(App.articleCollection.at(App.counter));
				App.showingtwitter = false;
				App.counter+=1;
				App.timeouthandle = setTimeout(App.rotateStuff, App.timeoutvalue);
			}
			else {
				App.counter=0;
				if(twitterbox.attr('checked') && !App.showingtwitter){
					$.post("/rest/showtwitterfeed", {checked: true});
					App.showingtwitter =true;
					App.timeouthandle = setTimeout(App.showMixSlides, App.timeoutvalue);
				}
				else{
					if(mixbox.attr('checked')){
						App.showingtwitter = false;
						App.showMixSlides();
					}
					else App.timeouthandle = setTimeout(App.rotateStuff, App.timeoutvalue);
				}
			}

		}
		else{
			App.counter=0;
			if(twitterbox.attr('checked') && !App.showingtwitter){
				$.post("/rest/showtwitterfeed", {checked: true});
				App.showingtwitter =true;
				App.timeouthandle = setTimeout(App.rotateStuff, App.timeoutvalue);
			}
			else{
				if(mixbox.attr('checked')){
					App.showingtwitter = false;
					App.showMixSlides();
				}
				else App.timeouthandle = setTimeout(App.rotateStuff, App.timeoutvalue);
			}
		}
	},

	showMixSlides: function(){
		if($('input:checkbox[name=mix]').attr('checked') && App.slidenumber< 6){
			App.showingtwitter = false;
			var slideid = "#slide"+App.slidenumber;
			var clone = $(slideid).clone();
			$("#articles").append(clone);
			App.doSlide();
			App.slidenumber+=1;
			App.timeouthandle = setTimeout(App.showMixSlides, App.timeoutvalue);
		}
		else{
			App.slidenumber = 1;
			App.rotateStuff();
		}
	},

	insertRandomArticle: function (){
		var randomIndex = Math.floor(Math.random()*App.randomArticles.length);

		var articleModel = new App.ArticleModel(App.randomArticles[randomIndex]);
		App.articleCollection.add(articleModel);
	},

	doSlide: function(){
		/*
		  $('#articles').animate({
		    left: '-=1811'
		  }, 1000, function() {
		    // Animation complete.
		  });
*/
		var articles = $('#articles')[0];
		App.offsetLeft = App.offsetLeft - 1811;
		$('#articles').css("left", App.offsetLeft + "px");
/*
		var transform = 'translateX('+App.offsetLeft+'px)';
		articles.style.MozTransform = transform;
		articles.style.WebkitTransform = transform;
		articles.style.OTransform = transform*/
	}
};


// Backbone list view
App.ArticlelistView = Backbone.View.extend({
	el: "#articles",

	initialize: function(){
		App.articleCollection.bind("add", this.renterPicture, this);
		App.tweetsCollection.bind("add", this.renderTweets, this);
	},

	renterPicture: function(model){
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
	},

	renderTweets: function(model){
		var tweetsView = new App.TweetsView({model: model});
		$(this.el).append(tweetsView.render().el);
		App.doSlide();
	}
});

//Backbone View:
App.ArticleView = Backbone.View.extend({
	tagName: "div",
	className: "article",

	initialize: function(){
		this.template = $("#article-template");

		this.model.bind('destroy', this.destroy_handler, this);
	},

	render: function(){
		var html = this.template.tmpl(this.model.toJSON());
		$(this.el).html(html);
		return this;
	},

	destroy_handler: function(model){
		console.log("destroy");
		$(this.el).remove();
	}
});

//Backbone View:
App.TweetsView = Backbone.View.extend({
	tagName: "div",
	className: "article",

	initialize: function(){
		this.template = $("#tweets-template");

		this.model.bind('destroy', this.destroy_handler, this);
	},

	render: function(){
		var html = this.template.tmpl(this.model.toJSON());
		$(this.el).html(html);
		return this;
	},

	destroy_handler: function(model){
		console.log("destroy");
		$(this.el).remove();
	}
});


//Backbone Model:
App.ArticleModel = Backbone.Model.extend({
	// required:
	// * title
	// * time
	// * picture (url to image)
	// * content
});

App.TweetsModel = Backbone.Model.extend({
	// required:
	// * searchterm
	// * tweets
});

// Backbone Collection
App.ArticleCollection = Backbone.Collection.extend({
	model: App.ArticleModel
});

App.TweetsCollection = Backbone.Collection.extend({
	model: App.TweetsModel
});

$(App.start);