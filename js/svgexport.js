function exportInlineSVG(svg, receiver) {
  
  var xlinkNS = "http://www.w3.org/1999/xlink";

  // This will convert an external image to a dataURL
  var toDataURL = function(image) {

	var img = new Image();
	// CORS workaround, this won't work in IE<11
	// If you are sure you don't need it, remove the next line and the double onerror handler
	// First try with crossorigin set, it should fire an error if not needed
	img.crossOrigin = 'Anonymous';

	img.onload = function() {
	  // we should now be able to draw it without tainting the canvas
	  var canvas = document.createElement('canvas');
	  canvas.width = this.width;
	  canvas.height = this.height;
	  // draw the loaded image
	  canvas.getContext('2d').drawImage(this, 0, 0);
	  // set our original <image>'s href attribute to the dataURL of our canvas
	  image.setAttributeNS(xlinkNS, 'href', canvas.toDataURL());
	  // that was the last one
	  if (++encoded === total)
		exportDoc()
	}

	// No CORS set in the response		
	img.onerror = function() {
		// save the src
		var oldSrc = this.src;
		// there is an other problem
		this.onerror = function() {
			console.warn('failed to load an image at : ', this.src);
			if (--total === encoded && encoded > 0)
			  exportDoc();
		  }
		  // remove the crossorigin attribute
		this.removeAttribute('crossorigin');
		// retry
		this.src = '';
		this.src = oldSrc;
	  }
	  // load our external image into our img
	img.src = image.getAttributeNS(xlinkNS, 'href');
  }

  // The final function that will export our svgNode to our receiver
  var exportDoc = function() {
	// check if our svgNode has width and height properties set to absolute values
	// otherwise, canvas won't be able to draw it
	if (svg.width.baseVal.unitType !== 1)
	  svg.setAttribute('width', svg.getBBox().width);
	if (svg.height.baseVal.unitType !== 1)
	  svg.setAttribute('height', svg.getBBox().height);

	// serialize our node
	var svgData = (new XMLSerializer()).serializeToString(svg);
	// remember to encode special chars
	var svgURL = 'data:image/svg+xml; charset=utf8, ' + encodeURIComponent(svgData);

	var svgImg = new Image();

	svgImg.onload = function() {
	  // if we set a canvas as receiver, then use it
	  // otherwise create a new one
	  var canvas = (receiver && receiver.nodeName === 'CANVAS') ? receiver : document.createElement('canvas');
	  canvas.width = this.width;
	  canvas.height = this.height;
	  canvas.getContext('2d').drawImage(this, 0, 0);
	  // try to catch IE
	  
	  receiver(canvas.toDataURL(), canvas);
	  
	}
	
	svgImg.src = svgURL;
	
  }

  var images = svg.querySelectorAll('image'),
	total = images.length,
	encoded = 0;
  // Loop through all our <images> elements
  for (var i = 0; i < images.length; i++) {
	// check that the image is external
	if (images[i].getAttributeNS(xlinkNS, 'href').indexOf('data:image') < 0)
	  toDataURL(images[i]);
	// else increment our counter
	else if (++encoded === total)
	  exportDoc()
  }
  // if there were no <image> element
  if (total === 0) exportDoc();
}