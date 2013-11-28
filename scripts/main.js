var width = 640, height = 480;//can also use video.offsetHeight/video.offsetWidth but the value seems to change once the video actually starts.
var video;

// get user media
getUserMedia(function (err, stream) {
  if (err) {
    console.log('failed', err);
  } else {
    console.log('got a stream', stream);
    video = attachMediaStream(stream);
    init();
  }
});


//I'm using this as a good resource: view-source:http://stemkoski.github.io/Three.js/Video.html
//also: http://www.html5rocks.com/en/tutorials/getusermedia/intro/

var videoImageContext;

function init() {
  videoImage = document.createElement( 'canvas' );
	videoImage.width = width;
	videoImage.height = height;
	document.body.appendChild( videoImage );
	videoImageContext = videoImage.getContext( '2d' );
	videoImageContext.scale(-1, 1);
  animate();
}

function animate(){
  requestAnimationFrame( animate );
	render();
}


var color_ratio = 1.5, threshold = 40;
var tx = width/2, ty = height/2, angleInRadians = Math.PI;
function chromaKey() {
	//mirror the image using scale(-1, 1)
	videoImageContext.drawImage(video, -width, 0, width, height);
  //videoImageContext.drawImage(video, 0, 0, width, height); //original method
  var frame = videoImageContext.getImageData(0, 0, width, height);
  var l = frame.data.length / 4;
  
  for (var i = 0; i < l; i++) {
    var pos = i*4;
    var r = frame.data[pos + 0];
    var g = frame.data[pos + 1];
    var b = frame.data[pos + 2];
    if ((b>r*color_ratio && b>g*color_ratio && b > threshold)){
      frame.data[pos + 0] = 255;
      frame.data[pos + 1] = 255;
      frame.data[pos + 2] = 255;
      frame.data[pos + 3] = 0;
    }
  }
  //renderer.clear();
  videoImageContext.putImageData(frame, 0, 0);
  //videoImageContext.clearRect(0,0,50,50);
}


function fancy() {
  videoImageContext.drawImage(this.video, 0, 0);
  var frame = videoImageContext.getImageData(0, 0, width, height);
  var l = frame.data.length / 4;
  
  for (var i = 0; i < l; i++) {
    var pos = i*4;
    var r = frame.data[pos + 0];
    var g = frame.data[pos + 1];
    var b = frame.data[pos + 2];
    if ((b>r*color_ratio && b>g*color_ratio && b > threshold)){
      frame.data[pos + 0] = 255;
      frame.data[pos + 1] = 255;
      frame.data[pos + 2] = 255;
      frame.data[pos + 3] = 0;
    }
  }
  //renderer.clear();
  videoImageContext.putImageData(frame, 0, 0);
  //videoImageContext.clearRect(0,0,50,50);
}

function render(){	
	if (video.readyState === video.HAVE_ENOUGH_DATA ){
    chromaKey();
    //fancy();
	}
}