# Web2AndroidGame
在浏览器上玩安卓上的游戏

基于WebRTC实现Web端共享Android屏幕 （https://www.jianshu.com/p/265f42c7fe10）
由于项目需求，前段时间了解了WebRTC相关技术，项目需要实现一个屏幕共享端功能，即在Web 端能够同步查看远端Android机器的屏幕画面。在Github上搜索了一圈之后，终于找到两个可以直接利用的项目，一个是ProjectRTC，另一个就是Google官方的AppRTC。
最终的实现方案是基于这两个开源项目的结合，ProjectRTC项目结构较为轻量，信令交互流程简洁清晰，但是只实现了摄像头图像推流，使用的WebRTC库也比较老旧，而AppRTC项目结构相对比较复杂，服务器端搭建起来比较麻烦，但是使用的库是比较新的，并且有录屏推流相关的API。
所以最终方案为：利用ProjectRTC的基本结构和信令交互流程，替换其中的WebRTC库文件（jar和so文件），提取AppRTC项目中录屏推流部分相关代码来实现功能。
Github上目前有以下几个基于AppRTC的Android端Demo源码编译好的AndroidStudio工程，运行APK即可测试录屏推流功能（科学上网）。

https://github.com/njovy/AppRTCDemo.git
https://github.com/a3349384/AppRTCDemo1.0.21217.git
https://github.com/Piasy/AppRTC-Android.git
ScreenShareRTC 原仓库地址：https://github.com/Jeffiano/ScreenShareRTC，在Android代码的string.xml中修改host地址即可
ProjcectRTC 原仓库地址：https://github.com/pchab/ProjectRTC 这个项目和ProjectRTC中的Server端代码搭配使用（需要搭建nodejs环境）



