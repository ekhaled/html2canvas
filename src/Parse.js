/*
 *  New function for traversing elements
 */

html2canvas.Parse = function(element, images, opts){
  
    opts = opts || {};
  
    // select body by default
    if (element === undefined){
        element = document.body;
    }
    
    
    var support = {
        rangeBounds: false
        
    },
    options = {
        iframeDefault: "default",
        ignoreElements: "IFRAME|OBJECT|PARAM",
        useOverflow: true,
        letterRendering: false
    },
    needReorder = false,
    numDraws = 0,
    fontData = {},
    ignoreElementsRegExp = new RegExp("("+options.ignoreElements+")");
    
    images = images || [];
    
    // Test whether we can use ranges to measure bounding boxes
    // Opera doesn't provide valid bounds.height/bottom even though it supports the method.

    
    if (document.createRange){
        var r = document.createRange();
        //this.support.rangeBounds = new Boolean(r.getBoundingClientRect);
        if (r.getBoundingClientRect){
            var testElement = document.createElement('boundtest');
            testElement.style.height = "123px";
            testElement.style.display = "block";
            document.getElementsByTagName('body')[0].appendChild(testElement);
            
            r.selectNode(testElement);
            var rangeBounds = r.getBoundingClientRect();
            var rangeHeight = rangeBounds.height;

            if (rangeHeight==123){
                support.rangeBounds = true;
            }
            document.getElementsByTagName('body')[0].removeChild(testElement);

            
        }
        
    }
    
    
    /*
    var rootStack = new this.storageContext($(document).width(),$(document).height());  
    rootStack.opacity = this.getCSS(this.element,"opacity");
    var stack = this.newElement(this.element,rootStack);
        
        
    this.parseElement(this.element,stack);  
     */

    function loadImage (src){	     
        
        var imgIndex = -1;
        if (images.indexOf){
            imgIndex = images.indexOf(src);
        }else{
            for(var i = 0, imgLen = images.length; i < imgLen.length; i++){
                if(images[i] === src) {
                    imgIndex = i;
                    break;
                } 
            }
        }
        
        
        
        if (imgIndex > -1){
            return images[imgIndex+1];
        }else{
            return false;
        }
				
    }
    
    
    function fontMetrics(font, fontSize){
    
        if (fontData[font+"-"+fontSize] !== undefined){
            return fontData[font+"-"+fontSize];
        }

    
        var container = document.createElement('div');
        document.getElementsByTagName('body')[0].appendChild(container);
    
        // jquery to speed this up, TODO remove jquery dependancy
        $(container).css({
            visibility:'hidden',
            fontFamily:font,
            fontSize:fontSize,
            margin:0,
            padding:0
        });
    

    
        var img = document.createElement('img');
    
        // TODO add another image
        img.src = "http://html2canvas.hertzen.com/images/8.jpg";
        img.width = 1;
        img.height = 1;
    
        $(img).css({
            margin:0,
            padding:0
        });
        var span = document.createElement('span');
    
        $(span).css({
            fontFamily:font,
            fontSize:fontSize,
            margin:0,
            padding:0
        });
    
    
        span.appendChild(document.createTextNode('Hidden Text'));
        container.appendChild(span);
        container.appendChild(img);
        var baseline = (img.offsetTop-span.offsetTop)+1;
    
        container.removeChild(span);
        container.appendChild(document.createTextNode('Hidden Text'));
    
        $(container).css('line-height','normal');
        $(img).css("vertical-align","super");
        var middle = (img.offsetTop-container.offsetTop)+1;  
    
        var metricsObj = {
            baseline: baseline,
            lineWidth: 1,
            middle: middle
        };
    
    
        fontData[font+"-"+fontSize] = metricsObj;
    
        $(container).remove();
 
    
        return metricsObj;
    
    }
    
    function textTransform(text, transform){
        switch(transform){
            case "lowercase":
                return text.toLowerCase();
                break;
					
            case "capitalize":
                return text.replace( /(^|\s|:|-|\(|\))([a-z])/g , function(m,p1,p2){
                    return p1+p2.toUpperCase();
                } );
                break;
					
            case "uppercase":
                return text.toUpperCase();
                break;
            default:
                return text;
				
        }
        
    }
    
    function trimText(text){
        return text.replace(/^\s*/, "").replace(/\s*$/, "");
    }
    
    function drawText(currentText, x, y, ctx){
        if (trimText(currentText).length>0){	
        
            ctx.fillText(currentText,x,y);
            numDraws++;
        }           
    }
    
    function getBounds(el) {
        
        window.scroll(0,0);
        
        if (el.getBoundingClientRect){	
            var clientRect = el.getBoundingClientRect();
            
            var bounds = {};
            // TODO add scroll position to bounds, so no scrolling of window necessary
            bounds.top = clientRect.top;
            bounds.bottom = clientRect.bottom || (clientRect.top + clientRect.height);
            bounds.left = clientRect.left;
            bounds.width = clientRect.width;
            bounds.height = clientRect.height;
    
            return bounds;
            
        }else{
            
            // TODO remove jQuery dependancy
            var p = $(el).offset();       
          
            return {               
                left: p.left + getCSS(el,"borderLeftWidth", true),
                top: p.top + getCSS(el,"borderTopWidth", true),
                width:$(el).innerWidth(),
                height:$(el).innerHeight()                
            }

        }           
    }
    
    function setZ(zIndex, position, parentZ, parentNode){
        // TODO fix static elements overlapping relative/absolute elements under same stack, if they are defined after them
        
        if (!parentZ){

            this.zStack = new html2canvas.zContext(0);
            return this.zStack;
        }
    
        if (zIndex !== "auto"){
            needReorder = true;
            var newContext = new html2canvas.zContext(zIndex);
            parentZ.children.push(newContext);     
            return newContext;
        
        }else {
            return parentZ;
        } 
    }
    
    function backgroundUrl (src){
        if (src.substr(0,5) === 'url("'){
            src = src.substr(5);
            src = src.substr(0,src.length-2);                 
        }else{
            src = src.substr(4);
            src = src.substr(0,src.length-1);  
        }
  
        return src;            
    }

    
    function renderBorders(el, ctx, bounds, clip){
    
    
        var x = bounds.left,
        y = bounds.top,
        w = bounds.width,
        h = bounds.height;
    
        /*
         *  TODO add support for different border-style's than solid   
         */            
        
        var borders = (function(el){
            var borders = [],
            sides = ["Top","Right","Bottom","Left"];
        
            for (var s = 0; s < 4; s++){
                borders.push({
                    width: getCSS(el, 'border' + sides[s] + 'Width', true),
                    color: getCSS(el, 'border' + sides[s] + 'Color', false)
                });          
            }
          
            return borders; 
            
        })(el);    
        
        
        

    
    
        for (var borderSide = 0, borderData; borderSide < 4; borderSide++){
            borderData = borders[borderSide];
                
            if (borderData.width>0){
                var bx = x,
                by = y,
                bw = w,
                bh = h - (borders[2].width);
                
                switch(borderSide){
                    case 0:
                        // top border
                        bh = borders[0].width;
                        break;
                    case 1:
                        // right border
                        bx = x + w-(borders[1].width);
                        bw = borders[1].width;                              
                        break;
                    case 2:
                        // bottom border
                        by = (by+h)-(borders[2].width);
                        bh = borders[2].width;
                        break;
                    case 3:
                        // left border
                        bw = borders[3].width;  
                        break;
                }		
                   
                var borderBounds = {
                    left:bx,
                    top:by,
                    width: bw,
                    height:bh
                };
                   
                if (clip){
                    borderBounds = _.clipBounds(borderBounds,clip);
                }
                   
                   
                if (borderBounds.width>0 && borderBounds.height>0){       
                    
                    renderRect(ctx,bx,by,borderBounds.width,borderBounds.height,borderData.color);
                }
                
          
            }
        }

        return borders;
    
    };
    
    // Drawing a rectangle 								
    function renderRect(ctx, x, y, w, h, bgcolor){
        if (bgcolor !=="transparent"){
            ctx.setVariable("fillStyle", bgcolor);
            ctx.fillRect (x, y, w, h);
            numDraws++;
        }
    }
    
    function getBackgroundPosition(el, bounds, image){
        // TODO add support for multi image backgrounds
    
        var bgpos = getCSS(el, "backgroundPosition").split(",")[0] || "0 0";
        // var bgpos = $(el).css("backgroundPosition") || "0 0";
        var bgposition = bgpos.split(" "),
        topPos,
        left,
        percentage;

        if (bgposition.length === 1){
            var val = bgposition;
            bgposition = []
        
            bgposition[0] = val,
            bgposition[1] = val;
        }  

    

        if (bgposition[0].toString().indexOf("%")!=-1){    
            percentage = (parseFloat(bgposition[0])/100);        
            left =  ((bounds.width * percentage)-(image.width*percentage));
      
        }else{
            left = parseInt(bgposition[0],10);
        }

        if (bgposition[1].toString().indexOf("%")!=-1){  

            percentage = (parseFloat(bgposition[1])/100);     
            topPos =  ((bounds.height * percentage)-(image.height*percentage));
        }else{      
            topPos = parseInt(bgposition[1],10);      
        }
   
        var returnObj = {}
  
        returnObj.top = topPos;
        returnObj.left = left;
    

          
        return returnObj;
         
    }
    
    function renderBackground(el,bounds,ctx){
               
        // TODO add support for multi background-images
        var background_image = getCSS(el, "backgroundImage", false).split(",")[0];
        var background_repeat = getCSS(el, "backgroundRepeat", false).split(",")[0];
        
        if (typeof background_image !== "undefined" && /^(1|none)$/.test(background_image)===false && /^(-webkit|-moz|linear-gradient|-o-)/.test(background_image)===false){
         
            background_image = backgroundUrl(background_image);
            var image = loadImage(background_image);
					

            var bgp = getBackgroundPosition(el, bounds, image),
            bgy;

            if (image){
                switch(background_repeat){
					
                    case "repeat-x":
                        renderBackgroundRepeatX(ctx,image,bgp,bounds.left,bounds.top,bounds.width,bounds.height);                     
                        break;
                         
                    case "repeat-y":
                        renderBackgroundRepeatY(ctx,image,bgp,bounds.left,bounds.top,bounds.width,bounds.height);                                             
                        break;
                          
                    case "no-repeat":
                        /*
                    this.drawBackgroundRepeat(
                        ctx,
                        image,
                        bgp.left+bounds.left, // sx
                        bgp.top+bounds.top, // sy
                        Math.min(bounds.width,image.width),
                        Math.min(bounds.height,image.height),
                        bounds.left,
                        bounds.top
                        );*/
                            
      
                        // console.log($(el).css('background-image'));
                        var bgw = bounds.width-bgp.left,
                        bgh = bounds.height-bgp.top,
                        bgsx = bgp.left,
                        bgsy = bgp.top,
                        bgdx = bgp.left+bounds.left,
                        bgdy = bgp.top+bounds.top;

                        //
                        //     bgw = Math.min(bgw,image.width);
                        //  bgh = Math.min(bgh,image.height);     
                    
                        if (bgsx<0){
                            bgsx = Math.abs(bgsx);
                            bgdx += bgsx; 
                            bgw = Math.min(bounds.width,image.width-bgsx);
                        }else{
                            bgw = Math.min(bgw,image.width);
                            bgsx = 0;
                        }
                           
                        if (bgsy<0){
                            bgsy = Math.abs(bgsy);
                            bgdy += bgsy; 
                            // bgh = bgh-bgsy;
                            bgh = Math.min(bounds.height,image.height-bgsy);
                        }else{
                            bgh = Math.min(bgh,image.height); 
                            bgsy = 0;
                        }    
    
                  
                        //   bgh = Math.abs(bgh);
                        //   bgw = Math.abs(bgw);
                        if (bgh>0 && bgw > 0){        
                            renderImage(
                                ctx,
                                image,
                                bgsx, // source X : 0 
                                bgsy, // source Y : 1695
                                bgw, // source Width : 18
                                bgh, // source Height : 1677
                                bgdx, // destination X :906
                                bgdy, // destination Y : 1020
                                bgw, // destination width : 18
                                bgh // destination height : 1677
                                );
                            
                            // ctx.drawImage(image,(bounds.left+bgp.left),(bounds.top+bgp.top));	                      
                            break;
                        }
                        
                    default:
                        var height,
                        add;
                        
                              
                        bgp.top = bgp.top-Math.ceil(bgp.top/image.height)*image.height;                
                        
                        
                        for(bgy=(bounds.top+bgp.top);bgy<bounds.height+bounds.top;){  
           
                        
           
                            var h = Math.min(image.height,(bounds.height+bounds.top)-bgy);
                           
                            
                            if ( Math.floor(bgy+image.height)>h+bgy){
                                height = (h+bgy)-bgy;
                            }else{
                                height = image.height;
                            }
                            // console.log(height);
                            
                            if (bgy<bounds.top){
                                add = bounds.top-bgy;
                                bgy = bounds.top;
                                
                            }else{
                                add = 0;
                            }
                                              
                            renderBackgroundRepeatX(ctx,image,bgp,bounds.left,bgy,bounds.width,height);  
                            if (add>0){
                                bgp.top += add;
                            }
                            bgy = Math.floor(bgy+image.height)-add; 
                        }
                        break;
                        
					
                }	
            }else{
                    
                html2canvas.log("Error loading background:" + background_image);
            //console.log(images);
            }
					
        }
    }
    function renderImage(ctx, image, sx, sy, sw, sh, dx, dy, dw, dh){
        ctx.drawImage(
            image,
            sx, //sx
            sy, //sy
            sw, //sw
            sh, //sh
            dx, //dx
            dy, // dy
            dw, //dw
            dh //dh      
            );
        numDraws++; 
    
    }
        
    function renderBackgroundRepeat (ctx, image, x, y, width, height, elx, ely){
        var sourceX = 0,
        sourceY=0;
        if (elx-x>0){
            sourceX = elx-x;
        }
        
        if (ely-y>0){
            sourceY = ely-y;
        }

        renderImage(
            ctx,
            image,
            sourceX, // source X
            sourceY, // source Y 
            width-sourceX, // source Width
            height-sourceY, // source Height
            x+sourceX, // destination X
            y+sourceY, // destination Y
            width-sourceX, // destination width
            height-sourceY // destination height
            );
    }
    
    
    function renderBackgroundRepeatY (ctx, image, bgp, x, y, w, h){
        
        var height,
        width = Math.min(image.width,w),bgy;   
            
        bgp.top = bgp.top-Math.ceil(bgp.top/image.height)*image.height;                
        
        
        for(bgy=(y+bgp.top);bgy<h+y;){   
            
         
            if ( Math.floor(bgy+image.height)>h+y){
                height = (h+y)-bgy;
            }else{
                height = image.height;
            }
            renderBackgroundRepeat(ctx,image,x+bgp.left,bgy,width,height,x,y);   
      
            bgy = Math.floor(bgy+image.height); 
                              
        } 
    }
    
    function renderBackgroundRepeatX(ctx, image, bgp, x, y, w, h){
                           
        var height = Math.min(image.height,h),
        width,bgx;             
        
            
        bgp.left = bgp.left-Math.ceil(bgp.left/image.width)*image.width;                
        
        
        for(bgx=(x+bgp.left);bgx<w+x;){   

            if (Math.floor(bgx+image.width)>w+x){
                width = (w+x)-bgx;
            }else{
                width = image.width;
            }
                
            renderBackgroundRepeat(ctx,image,bgx,(y+bgp.top),width,height,x,y);       
             
            bgx = Math.floor(bgx+image.width); 

                                
        } 
    }

    function renderText(el, textNode, stack, form){
        var ctx = stack.ctx;
        var family = getCSS(el, "fontFamily", false);
        var size = getCSS(el, "fontSize", false);
        var color = getCSS(el, "color", false);
  

     
        var text_decoration = getCSS(el, "textDecoration", false);
        var text_align = getCSS(el, "textAlign", false);  
    
    
        var letter_spacing = getCSS(el, "letterSpacing", false);

        // apply text-transform:ation to the text
        
        
        
        textNode.nodeValue = textTransform(textNode.nodeValue, getCSS(el, "textTransform", false));	
        var text = trimText(textNode.nodeValue);
	
        //text = $.trim(text);
        if (text.length>0){

            
            
            if (text_decoration !== "none"){
                var metrics = fontMetrics(family, size);         
            }    
        
            var renderList,
            renderWords = false;
        
        	
            text_align = text_align.replace(["-webkit-auto"],["auto"])
        
        
            if (options.letterRendering === false && /^(left|right|justify|auto)$/.test(text_align) && /^(normal|none)$/.test(letter_spacing)){
                // this.setContextVariable(ctx,"textAlign",text_align);  
                renderWords = true;
                renderList = textNode.nodeValue.split(/(\b| )/);
            
            }else{
                //  this.setContextVariable(ctx,"textAlign","left");
                renderList = textNode.nodeValue.split("");
            }
       

  
            var bold = getCSS(el, "fontWeight", false),
            font_style = getCSS(el, "fontStyle", false),
            font_variant = getCSS(el, "fontVariant", false),
            align = false; // sort this out at some point
                
            switch(parseInt(bold, 10)){
                case 401:
                    bold = "bold";
                    break;
                case 400:
                    bold = "normal";
                    break;
            }
  
            ctx.setVariable("fillStyle", color);  
            ctx.setVariable("font", font_variant+" "+bold+" "+font_style+" "+size+" "+family);
                
            if (align){
                ctx.setVariable("textAlign","right");
            }else{
                ctx.setVariable("textAlign","left");
            }
    
            
            
        

        
            /*
        if (stack.clip){
        ctx.rect (stack.clip.left, stack.clip.top, stack.clip.width, stack.clip.height);
        ctx.clip();
        }
             */
        

            
         
            var oldTextNode = textNode;
            for(var c=0; c<renderList.length; c++){
            
                        
                // IE 9 bug
                if (typeof oldTextNode.nodeValue !== "string"){
                    continue;
                }
                
                // TODO only do the splitting for non-range prints
                var newTextNode = oldTextNode.splitText(renderList[c].length);
           
                if (text_decoration !== "none" || trimText(oldTextNode.nodeValue).length !== 0){
                
               
           

                    if (support.rangeBounds){
                        // getBoundingClientRect is supported for ranges
                        var range, bounds;
                        if (document.createRange){
                            range = document.createRange();
                            range.selectNode(oldTextNode);
                        }else{
                            // TODO add IE support
                            range = document.body.createTextRange();
                        }
                        
                        if (range.getBoundingClientRect()){
                            bounds = range.getBoundingClientRect();
                        }else{
                            bounds = {};
                        }
                    }else{
                        // it isn't supported, so let's wrap it inside an element instead and the bounds there
               
                        var parent = oldTextNode.parentNode;
                        var wrapElement = document.createElement('wrapper');
                        var backupText = oldTextNode.cloneNode(true);
                        wrapElement.appendChild(oldTextNode.cloneNode(true));
                        parent.replaceChild(wrapElement,oldTextNode);
                                    
                        var bounds = this.getBounds(wrapElement);
    
                        parent.replaceChild(backupText,wrapElement);      
                    }
               
               
       

                    //   console.log(range);
                    //      console.log("'"+oldTextNode.nodeValue+"'"+bounds.left)
                    drawText(oldTextNode.nodeValue, bounds.left, bounds.bottom, ctx);
                    
                    switch(text_decoration) {
                        case "underline":	
                            // Draws a line at the baseline of the font
                            // TODO As some browsers display the line as more than 1px if the font-size is big, need to take that into account both in position and size         
                            renderRect(ctx,bounds.left,Math.round(bounds.top+metrics.baseline+metrics.lineWidth),bounds.width,1,color);
                            break;
                        case "overline":
                            renderRect(ctx,bounds.left,bounds.top,bounds.width,1,color);
                            break;
                        case "line-through":
                            // TODO try and find exact position for line-through
                            renderRect(ctx,bounds.left,Math.ceil(bounds.top+metrics.middle+metrics.lineWidth),bounds.width,1,color);
                            break;
                    
                    }	
                
                }
            
                oldTextNode = newTextNode;
                  
                  
                  
            }
        
         
					
        }
			
    }
    
    function renderElement(el, parentStack){
		
        var bounds = getBounds(el), 
        x = bounds.left, 
        y = bounds.top, 
        w = bounds.width, 
        h = bounds.height, 
        image,
        bgcolor = getCSS(el, "backgroundColor", false),
        cssPosition = getCSS(el, "position", false);
        
        parentStack = parentStack || {};

        //var zindex = this.formatZ(this.getCSS(el,"zIndex"),cssPosition,parentStack.zIndex,el.parentNode);
   
        var zindex = setZ(getCSS(el, "zIndex", false), cssPosition, parentStack.zIndex, el.parentNode);
    
        var opacity = getCSS(el, "opacity");   


        var stack = {
            ctx: new html2canvas.canvasContext(),
            zIndex: zindex,
            opacity: opacity*parentStack.opacity,
            cssPosition: cssPosition
        };
    
    
 
        // TODO correct overflow for absolute content residing under a static position
        if (parentStack.clip){
            stack.clip = $.extend({}, parentStack.clip);
            //stack.clip = parentStack.clip;
            stack.clip.height = stack.clip.height - parentStack.borders[2].width;
        } 
 
 
        if (options.useOverflow === true && /(hidden|scroll|auto)/.test(getCSS(el, "overflow")) === true && !/(BODY)/i.test(el.nodeName) === true){
            if (stack.clip){
                stack.clip = this.clipBounds(stack.clip,bounds);
            }else{
                stack.clip = bounds;
            }
        }   


        var stackLength =  zindex.children.push(stack);
        
        var ctx = zindex.children[stackLength-1].ctx; 
    
        ctx.setVariable("globalAlpha", stack.opacity);  

        // draw element borders
        var borders = renderBorders(el, ctx, bounds);
        stack.borders = borders;
    
        // let's modify clip area for child elements, so borders dont get overwritten
    
        /*
    if (stack.clip){
        stack.clip.width = stack.clip.width-(borders[1].width); 
        stack.clip.height = stack.clip.height-(borders[2].width); 
    }
         */
        if (ignoreElementsRegExp.test(el.nodeName) && options.iframeDefault !== "transparent"){ 
            if (options.iframeDefault === "default"){
                bgcolor = "#efefef";
            /*
                 * TODO write X over frame
                 */
            }else{
                bgcolor = options.iframeDefault;           
            }
        }
               
        // draw base element bgcolor   

        var bgbounds = {
            left: x + borders[3].width,
            top: y + borders[0].width,
            width: w - (borders[1].width + borders[3].width),
            height: h - (borders[0].width + borders[2].width)
        };
        
        //if (this.withinBounds(stack.clip,bgbounds)){  
        
        if (stack.clip){
            bgbounds = this.clipBounds(bgbounds,stack.clip);
        
        //}    
    
        }
    
        if (bgbounds.height > 0 && bgbounds.width > 0){
            renderRect(
                ctx,
                bgbounds.left,
                bgbounds.top,
                bgbounds.width,
                bgbounds.height,
                bgcolor
                );
           
            renderBackground(el, bgbounds, ctx);     
        }
        
        switch(el.nodeName){
            case "IMG":
                var imgSrc = el.getAttribute('src');
                image = _.loadImage(imgSrc);
                if (image){

                    var paddingLeft = getCSS(el, 'paddingLeft', true),
                    paddingTop = getCSS(el, 'paddingTop', true),
                    paddingRight = getCSS(el, 'paddingRight', true),
                    paddingBottom = getCSS(el, 'paddingBottom', true);
                    
                    
                    this.drawImage(
                        ctx,
                        image,
                        0, //sx
                        0, //sy
                        image.width, //sw
                        image.height, //sh
                        x + paddingLeft + borders[3].width, //dx
                        y + paddingTop + borders[0].width, // dy
                        bounds.width - (borders[1].width + borders[3].width + paddingLeft + paddingRight), //dw
                        bounds.height - (borders[0].width + borders[2].width + paddingTop + paddingBottom) //dh       
                        );
           
                }else {
                    html2canvas.log("Error loading <img>:" + imgSrc);
                }
                break;
            case "INPUT":
                // TODO add all relevant type's, i.e. HTML5 new stuff
                // todo add support for placeholder attribute for browsers which support it
                if (/^(text|url|email|submit|button|reset)$/.test(el.type) && el.value.length > 0){
                
                    this.renderFormValue(el,bounds,stack);
                

                /*
                 this just doesn't work well enough
                
                this.newText(el,{
                    nodeValue:el.value,
                    splitText: function(){
                        return this;
                    },
                    formValue:true
                },stack);
                     */
                }
                break;
            case "TEXTAREA":
                if (el.value.length > 0){
                    this.renderFormValue(el,bounds,stack);
                }
                break;
            case "SELECT":
                if (el.options.length > 0){
                    this.renderFormValue(el,bounds,stack);
                }
                break;
            case "LI":
                // this.drawListItem(el,stack,bgbounds);
                break;
        }
    
         

        // return this.contextStacks[stackLength-1];
        return zindex.children[stackLength-1];
    }
    
    
    function getCSS(element, attribute, intOnly){
        
        if (intOnly !== undefined && intOnly === true){
            return parseInt(html2canvas.Util.getCSS(element, attribute), 10); 
        }else{
            return html2canvas.Util.getCSS(element, attribute);
        }
    }
    
    function parseElement(el, stack){
      
        // skip hidden elements and their children
        if (getCSS(el, 'display') !== "none" && getCSS(el, 'visibility') !== "hidden"){ 
     
            stack = renderElement(el, stack) || stack;
          
            ctx = stack.ctx;
    
            if (!ignoreElementsRegExp.test(el.nodeName)){
                // TODO remove jQuery
                var elementChildren = $(el).contents();
                for (var i = 0, childrenLen = elementChildren.length, node; i < childrenLen; i++){
                    node = elementChildren[i];
                    
                    if (node.nodeType === 1){
                        parseElement(node, stack);								
                    }else if (node.nodeType === 3){   
                        renderText(el, node, stack);
                    }      
                    
                }
               
            } 
        }
    }
    
    var stack, ctx;
    
    
    var rootStack = new html2canvas.canvasContext($(document).width(),$(document).height());  
    rootStack.opacity = getCSS(element,"opacity");
    
    var stack = renderElement(element, rootStack);
    
    // parse every child element
    for (var i = 0, children = element.children, childrenLen = children.length; i < childrenLen; i++){      
        parseElement(children[i], stack);  
    }
    
    return stack;

};

html2canvas.zContext = function(zindex){
    return {
        zindex: zindex,
        children: []
    };
    
}