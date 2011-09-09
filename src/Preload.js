html2canvas.Preload = function(element, opts){
    
    var options = {
        "proxy": "http://html2canvas.appspot.com/"
    },
    images = [],
    pageOrigin = window.location.protocol + window.location.host,
    imagesLoaded = 0,
    methods,
    i,
    domImages = element.ownerDocument.images, // TODO probably should limit it to images present in the element only
    imgLen = domImages.length;
    
    opts = opts || {};
    
    options = html2canvas.Util.Extend(opts, options);
    
   
    
    element = element || document.body;
    
    function isSameOrigin(url){
        var link = document.createElement("a");
        link.href = url;
        return ((link.protocol + link.host) === pageOrigin);
        
    }
    
    function getIndex(array,src){
        var i, arrLen;
        if (array.indexOf){
            return array.indexOf(src);
        }else{
            for(i = 0, arrLen = array.length; i < arrLen; i+=1){
                if(this[i] === src) {
                    return i;
                }
            }
            return -1;
        }
    
    }
    
    function start(){
        if (images.length === 0 || imagesLoaded === images.length/2){    
            
        
            /*
            this.log('Finished loading '+this.imagesLoaded+' images, Started parsing');
            this.bodyOverflow = document.getElementsByTagName('body')[0].style.overflow;
            document.getElementsByTagName('body')[0].style.overflow = "hidden";
            */
            if (typeof options.complete === "function"){
                options.complete(images);
            }
        }
    }
    
    function proxyGetImage(url, img){
     
    
        var link = document.createElement("a");
        link.href = url;
        url = link.href; // work around for pages with base href="" set

    
        // todo remove jQuery dependency and enable xhr2 requests where available (no need for base64 / json)
        $.ajax({
            data:{
                xhr2:false,
                url:url
            },
            url: options.proxy,
            dataType: "jsonp",
            success: function(a){
            
                if (a.substring(0,6) === "error:"){
                    images.splice(getIndex(images, url), 2);
                    start();  
                }else{
                    img.onload = function(){
                        imagesLoaded+=1;               
                        start();   
               
                    };     
                    img.src = a; 
                }


            },
            error: function(){ 
                images.splice(getIndex(images, url), 2);
                start();          
            }
        
        
        });
    
    }
    
    function getImages (el) {
        
     
    
        // if (!this.ignoreRe.test(el.nodeName)){
        // 
        // TODO remove jQuery dependancy
        var contents = $(el).contents(),
        i,
        contentsLen = contents.length,
        background_image,
        src;
        for (i = 0;  i < contentsLen; i+=1 ){
            // var ignRe = new RegExp("("+this.ignoreElements+")");
            // if (!ignRe.test(element.nodeName)){
            getImages(contents[i]);
        // }
        }
            
        // }
          
        if (el.nodeType === 1 || el.nodeType === undefined){
            
            background_image = html2canvas.Util.getCSS(el, 'backgroundImage');
           
            if (background_image && background_image !== "1" && background_image !== "none" && background_image.substring(0,7) !== "-webkit" && background_image.substring(0,3)!== "-o-" && background_image.substring(0,4) !== "-moz"){
                // TODO add multi image background support
                src = html2canvas.Util.backgroundImage(background_image.split(",")[0]);                    
                methods.loadImage(src);                    
            }
        }
    }  
    
    methods = {
        loadImage: function(src){
            var img;
            if (getIndex(images, src) === -1){
                if(src.substr(0, 5) === 'data:'){
                    //Base64 src
                    images.push(src);
                    img = new Image();
                    img.src = src;
                    images.push(img);
                    imagesLoaded+=1;
                    start();
                }else if (isSameOrigin(src)){
            
                    images.push(src);
                    img = new Image();   
                    // TODO remove jQuery dependancy

                    $(img).load(function(){
                        imagesLoaded+=1;               
                        start();        
                
                    });	
                    
                    img.onerror = function(){
                        images.splice(getIndex(images, img.src), 2);
                        start();                           
                    };
                    
                    img.src = src; 
                    images.push(img);
            
                }else if (options.proxy){
                    //    console.log('b'+src);
                    images.push(src);
                    img = new Image();   
                    proxyGetImage(src, img);
                    images.push(img);
                }
            }     
          
        }
        
        
    };
    
    // add something to array
    images.push('start');
    
    getImages(element);
    
    
    // load <img> images
    for (i = 0; i < imgLen; i+=1){
        methods.loadImage(domImages[i].getAttribute("src"));
    }
    
    // remove 'start'
    images.splice(0,1);  

    if (images.length === 0){
        start();
    }  
    
    return methods;
    
};



