App = {
	localMediaStream: null,
	starttime: null,
	detectorWorker: null,


	start: function () {

		console.log("hello world");

		// mustache laden:
		var mustache = new Image();
		mustache.src = "/images/mustache.png";

		var video = document.querySelector('video');
		var canvas = document.querySelector('canvas');
		var ctx = canvas.getContext('2d');


		App.detectorWorker = new Worker("/javascripts/haar-detector.js");

		App.detectorWorker.onmessage = function (event) {
			if(event.data.err){
				console.log(event.data.err);
			}

			if(event.data.objects){
				var objects = event.data.objects;

				var milliseconds = (new Date()).getTime() - App.starttime;

				$("#time").html(milliseconds/1000);

				for(var i=0; i < objects.length; i++){
					var rect = objects[i];
					//ctx.strokeRect(rect.x,rect.y,rect.width,rect.height);

					//mustache tekenen:

					var w = 3 * rect.width; // breedte is factor van de breedte van het kot
					var h = (mustache.height * w)/mustache.width;

					var x = rect.x + rect.width/2 - w/2; // int midden van het kot
					var y = rect.y + (rect.height - h/1.2); //onderaan het groene kot

            		ctx.drawImage(mustache, x, y, w, h);
				}
			}
		};




		navigator.webkitGetUserMedia({
			video: true //we willen enkel video
		}, function (stream) {
			video.src = window.webkitURL.createObjectURL(stream);
			App.localMediaStream = stream;
		}, function(e) {
			console.log('got no stream', e);
		});

		$("#mustacheme").click(function(){
			if (App.localMediaStream) {
				canvas.width = $("video").width();
				canvas.height = $("video").height();

				ctx.drawImage(video, 0, 0);

				ctx.strokeStyle="rgba(0,255,0,1)";

				App.starttime = (new Date()).getTime();

				App.detectorWorker.postMessage({set:{
					imagedata: canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height),
					haardata: haarcascade_mcs_nose,
					ratio: 1
				}});

				App.detectorWorker.postMessage({detect:{
					baseScale: 1,
					scale_inc: 1.25,
					increment: 0.1,
					min_neighbors: 1,
					doCannyPruning: true
				}});
			}
		});


	}
}

$(App.start);