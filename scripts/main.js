var video;

// get user media
getUserMedia(function (err, stream) {
  if (err) {
    console.log('failed', err);
  } else {
    console.log('got a stream', stream);
    video = attachMediaStream(stream);
    demo(video);
  }
});


//I'm using this as a good resource: view-source:http://stemkoski.github.io/Three.js/Video.html
//also: http://www.html5rocks.com/en/tutorials/getusermedia/intro/

function demo(vid) {
	var video = vid;
	var demo = this;
	var width = 640, height = 480;//can also use video.offsetHeight/video.offsetWidth but the value seems to change once the video actually starts.
	var el = document.getElementById('demo-content');
	
	var gui = new dat.GUI({ autoPlace: false });
	el.appendChild(gui.domElement);
	
	var videoImageContext;
	
	//public variables:
	this.mode = "chromaKey";
	gui.add(this, "mode", ["Chroma Key", "Subtraction", "Fancy Method"]);
	
	this.bg_snapshot = function(){
		snapshot();
	}
	gui.add(this, "bg_snapshot");

	init();
	
	function init() {
		videoImage = document.createElement( 'canvas' );
		videoImage.width = width;
		videoImage.height = height;
		el.appendChild( videoImage );
		
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
	
	function render(){
		if (video.readyState === video.HAVE_ENOUGH_DATA ){
			drawImage();
			switch (this.mode){
				case 'Chroma Key':
					chromaKey();
					break;
				case 'Subtraction':
					subtraction();
					break;
				case 'Fancy Method':
					fancy();
					break;
				default:
					chromaKey();
					break;
			}
		}
	}
	
	var color_ratio = 2.5, threshold = 40;
	function chromaKey() {
		var frame = videoImageContext.getImageData(0, 0, width, height);
		var l = frame.data.length / 4;
		
		for (var i = 0; i < l; i++) {
			var pos = i*4;
			var r = frame.data[pos + 0];
			var g = frame.data[pos + 1];
			var b = frame.data[pos + 2];
			if (b>r && b>g && (b>r*color_ratio || b>g*color_ratio) && b > threshold){
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
	
	var old_data = [], index = 0, buffer_length = 5, std_cutoff = 40;
	function fancy() {
		var frame = videoImageContext.getImageData(0, 0, width, height);
		old_data[index] = new Uint8ClampedArray(frame.data);
		
		var current_buffer_size = old_data.length;
		var l = frame.data.length / 4;
		for (var i = 0; i < l; i++) {
			var pos = i*4, mean = 0;
			for (var j = 0; j < current_buffer_size; j++)
				mean += (old_data[j][pos + 0] + old_data[j][pos + 1] + old_data[j][pos + 2])/3;
			mean /= buffer_length;
			
			var std = 0;
			for (var j = 0; j < current_buffer_size; j++) {
				var color_avg = (old_data[j][pos + 0] + old_data[j][pos + 1] + old_data[j][pos + 2])/3;
				std += Math.pow(color_avg - mean, 2);
			}
			std = Math.sqrt(std);
			//console.log('std: ', std);
			
			if (std < std_cutoff){
				//frame.data[pos + 0] = 255;
				//frame.data[pos + 1] = 255;
				//frame.data[pos + 2] = 255;
				frame.data[pos + 3] = 0;
			}
			//frame.data[pos + 3] = Math.exp(std);
		}
		//renderer.clear();
		videoImageContext.putImageData(frame, 0, 0);
		//videoImageContext.clearRect(0,0,50,50);
		index = (index+1)%buffer_length;
		//console.log('index: ', index);
	}
	
	var snapshot_data;
	function snapshot(){
		drawImage();
		var frame = videoImageContext.getImageData(0, 0, width, height);
		snapshot_data = new Uint8ClampedArray(frame.data);
	}
	
	var first = true, difference_threshold = 20, frame_length=0;
	function subtraction() {
		var frame = videoImageContext.getImageData(0, 0, width, height);
		if (first) {
			snapshot();
			first = false;
			frame_length = frame.data.length / 4;
		}
		for (var i = 0; i < frame_length; i++) {
			var pos = i*4, r = pos, g = pos+1, b = pos+2;
			
			var difference = Math.sqrt((Math.pow(frame.data[r]-snapshot_data[r], 2) + Math.pow(frame.data[g]-snapshot_data[g], 2) + Math.pow(frame.data[b]-snapshot_data[b], 2))/3);
			if (difference < difference_threshold) {
				frame.data[pos + 3] = 0;
			}
		}
		videoImageContext.putImageData(frame, 0, 0);
	}
	
	//var bin_images = [], bin_counts = [], total_bins = 5, curr_bins = 0, frame_length = 0;
	//function subtraction() {
	//  var frame = videoImageContext.getImageData(0, 0, width, height);
	//  if (curr_bins < bins) {
	//		bin_images[curr_bins] = new Uint8ClampedArray(frame.data);
	//		curr_bins++;
	//		frame_length = frame.data.length / 4;
	//	}
	//  for (var i = 0; i < frame_length; i++) {
	//		var pos = i*4, best_bin = 0, r = pos, g = pos+1, b = pos+2;
	//		
	//		var min_idx = 0, min_val = -1;
	//		for (var j = 0; j < curr_bins; j++){
	//			var data = possible_backgrounds[j];
	//			var difference = Math.sqrt((Math.pow(frame.data[r]-data[r], 2) + Math.pow(frame.data[g]-data[g], 2) + Math.pow(frame.data[b]-data[b], 2))/3);
	//			if (difference < max_val || min_val == -1) {
	//				max_val = difference;
	//				min_idx = j;
	//			}
	//		}
	//		
	//		
	//		var std = 0;
	//		for (var j = 0; j < buffer_length; j++) {
	//			var color_avg = (old_data[j][pos + 0] + old_data[j][pos + 1] + old_data[j][pos + 2])/3;
	//			std += Math.pow(color_avg - mean, 2);
	//		}
	//		std = Math.sqrt(std);
	//		//console.log('std: ', std);
	//		
	//    if (std < std_cutoff){
	//      //frame.data[pos + 0] = 255;
	//      //frame.data[pos + 1] = 255;
	//      //frame.data[pos + 2] = 255;
	//      frame.data[pos + 3] = 0;
	//    }
	//		//frame.data[pos + 3] = Math.exp(std);
	//  }
	//  //renderer.clear();
	//  videoImageContext.putImageData(frame, 0, 0);
	//  //videoImageContext.clearRect(0,0,50,50);
	//	index = (index+1)%buffer_length;
	//	//console.log('index: ', index);
	//}
}