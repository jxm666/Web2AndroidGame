var inputManager = (function () {


    function lisetInput(){

    // var parent = document.getElementById("remoteVideosContainer") // 获取父元素
    //var textArea = parent.getElementsByTagName('textarea') // 获取父元素下面的所有textarea元素
    // var div = parent.getElementsByTagName("video")[0];
    var div = document.getElementById("remoteVideosContainer").getElementsByTagName('video')[0];

    // div.onmousemove = function (event) {
    //     event = event || window.event;
    //     //2.获取鼠标在整个页面的位置
    //     var pagex = event.pageX || scroll().left + event.clientX;
    //     var pagey = event.pageY || scroll().top + event.clientY;
    //     //3.获取盒子在整个页面的位置
    //     var xx = div.offsetLeft;
    //     var yy = div.offsetTop
    //     //4.用鼠标的位置减去盒子的位置赋值给盒子的内容。
    //     var targetx = pagex - xx;
    //     var targety = pagey - yy;
    //     this.innerHTML = "鼠标在盒子中的X坐标为："+targetx+"px;<br>鼠标在盒子中的Y坐标为："+targety+"px;"
    // }
    div.onclick = function (event) {
        event = event || window.event;
        //2.获取鼠标在整个页面的位置
        var pagex = event.pageX || scroll().left + event.clientX;
        var pagey = event.pageY || scroll().top + event.clientY;
        //3.获取盒子在整个页面的位置
        var xx = div.offsetLeft;
        var yy = div.offsetTop
        //4.用鼠标的位置减去盒子的位置赋值给盒子的内容。
        var targetx = pagex - xx;
        var targety = pagey - yy;
        //控制台输出：
        console.log("onclick; 宽度："+div.videoWidth+"高度："+div.videoHeight+"鼠标在盒子中的X坐标为："+targetx+"px;<br>鼠标在盒子中的Y坐标为："+targety+"px;");
        // this.innerHTML = "onclick; 鼠标在盒子中的X坐标为："+targetx+"px;<br>鼠标在盒子中的Y坐标为："+targety+"px;"
    }


    //封装的scrollTop
    function scroll() {
        if(window.pageYOffset != null) {  // ie9+ 高版本浏览器
            // 因为 window.pageYOffset 默认的是  0  所以这里需要判断
            return {
                left: window.pageXOffset,
                top: window.pageYOffset
            }
        }
        else if(document.compatMode === "CSS1Compat") {    // 标准浏览器   来判断有没有声明DTD
            return {
                left: document.documentElement.scrollLeft,
                top: document.documentElement.scrollTop
            }
        }
        return {   // 未声明 DTD
            left: document.body.scrollLeft,
            top: document.body.scrollTop
        }
    }

    }
});