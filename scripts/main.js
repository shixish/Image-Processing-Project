var dim = [640, 480];//can also use video.offsetHeight/video.offsetWidth but the value seems to change once the video actually starts.
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

var camera, scene, renderer;
var mesh, videoTexture, videoImageContext;

//preload image asset:
var beach = THREE.ImageUtils.loadTexture( 'imgs/beach.jpg' )

function init() {
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(dim[0], dim[1]);
  renderer.setClearColor(0xffffff, 1);
  //renderer.setClearColorHex( 0xffffff, 1 );
  document.body.appendChild( renderer.domElement );

  camera = new THREE.PerspectiveCamera( 100, dim[0] / dim[1], 1, 1000 );
  camera.position.z = 200;

  scene = new THREE.Scene();  
  
  videoImage = document.createElement( 'canvas' );
	videoImage.width = dim[0];
	videoImage.height = dim[1];

	videoImageContext = videoImage.getContext( '2d' );
	// background color if no video present
	//videoImageContext.fillStyle = '#ffffff';
	//videoImageContext.fillRect( 0, 0, videoImage.width, videoImage.height );

	videoTexture = new THREE.Texture( videoImage );
	videoTexture.minFilter = THREE.LinearFilter;
	videoTexture.magFilter = THREE.LinearFilter;
  
//  //It works but spams an error: WebGL: INVALID_OPERATION: generateMipmap: level 0 not power of 2 or not all the same size 
//  videoTexture = new THREE.Texture( video );
//	videoTexture.minFilter = THREE.LinearFilter;
//	videoTexture.magFilter = THREE.LinearFilter;

  var backgroundTexture = beach;
  var backgroundMaterial = new THREE.MeshBasicMaterial( { map: backgroundTexture, transparent: true } );
	var backgroundGeometry = new THREE.PlaneGeometry( dim[0], dim[1], 1, 1 );
	var backgroundScreen = new THREE.Mesh( backgroundGeometry, backgroundMaterial );
  backgroundScreen.position.set(0,0,0);
  scene.add(backgroundScreen);
  
  var movieMaterial = new THREE.MeshBasicMaterial( { map: videoTexture, transparent: true, overdraw: true } );
	var movieGeometry = new THREE.PlaneGeometry( dim[0], dim[1], 1, 1 );
	var movieScreen = new THREE.Mesh( movieGeometry, movieMaterial );
	movieScreen.position.set(0,0,0);
	scene.add(movieScreen);
  
  //window.addEventListener( 'resize', onWindowResize, false );
  animate();
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate(){
  requestAnimationFrame( animate );
	render();		
	//update();
}


var color_ratio = 2, threshold = 40;
function chromaKey() {
  videoImageContext.drawImage(this.video, 0, 0);
  var frame = videoImageContext.getImageData(0, 0, dim[0], dim[1]);
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
  var frame = videoImageContext.getImageData(0, 0, dim[0], dim[1]);
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
		//videoImageContext.drawImage( video, 0, 0 );
    //chromaKey();
    fancy();
		if (videoTexture) videoTexture.needsUpdate = true;
	}
  
	renderer.render( scene, camera );
}