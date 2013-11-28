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


function drawImage(){
	//mirror the image using scale(-1, 1)
	videoImageContext.drawImage(video, -width, 0, width, height);
  //videoImageContext.drawImage(video, 0, 0, width, height); //original method
}

var color_ratio = 1.5, threshold = 40;
function chromaKey() {
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

var old_data = [], index = 0, buffer_length = 25, first = true;
function fancy() {
  var frame = videoImageContext.getImageData(0, 0, width, height);
  if (first) {
		for(var i = 0; i < buffer_length; i++){
			old_data[i] = new Uint8ClampedArray(frame.data);
		}
		first = false;
	}else{
		old_data[index] = new Uint8ClampedArray(frame.data);
	}
	
	var l = frame.data.length / 4;
  for (var i = 0; i < l; i++) {
		var pos = i*4, difference = 0, mean = 0;
		for (var j = 0; j < buffer_length; j++)
			mean += old_data[j][pos + 0]; //(old_data[j][pos + 0] + old_data[j][pos + 1] + old_data[j][pos + 2])/3;
		mean /= buffer_length;
		
		var std = 0;
		for (var j = 0; j < buffer_length; j++) {
			var color_avg = old_data[j][pos + 0]; //(old_data[j][pos + 0] + old_data[j][pos + 1] + old_data[j][pos + 2])/3;
			std += Math.pow(color_avg - mean, 2);
		}
		std = Math.sqrt(std);
		//console.log('std: ', std);
		
    if (std < 20){
      frame.data[pos + 0] = 255;
      frame.data[pos + 1] = 255;
      frame.data[pos + 2] = 255;
      frame.data[pos + 3] = 0;
    }
  }
  //renderer.clear();
  videoImageContext.putImageData(frame, 0, 0);
  //videoImageContext.clearRect(0,0,50,50);
	index = (index+1)%buffer_length;
	//console.log('index: ', index);
}

function render(){	
	if (video.readyState === video.HAVE_ENOUGH_DATA ){
		drawImage();
    //chromaKey();
    fancy();
	}
}