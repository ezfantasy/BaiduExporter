var CORE=(function(){
    const defaultUA ="netdisk;5.3.4.5;PC;PC-Windows;5.1.2600;WindowsBaiduYunGuanJia";
    const defaultreferer="http://pan.baidu.com/disk/home";
    const version = "0.5.4";
    const update_date = "2015/11/06";
    var cookies=null;
    return {
        init:function(){

        },
        //封装的百度的Toast提示消息
        //Type类型有
        //MODE_CAUTION  警告  MODE_FAILURE  失败  MODE_LOADING 加载 MODE_SUCCESS 成功
        setMessage:function(msg, type) {
        if(typeof require=="undefined"){
           Utilities.useToast({
                toastMode: disk.ui.Toast[type],
                msg: msg,
                sticky: false
            });
        }else{
            var Toast = require("common:widget/toast/toast.js");
            Toast.obtain.useToast({
                toastMode: Toast.obtain[type],
                msg: msg,
                sticky: false
            });            
        }

        },
        // 反转义非字母表中字符，确保按照文件名保存
        // 取自 https://github.com/binux/ThunderLixianExporter
        escapeString:function(str){
            var alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            var result = "";
            if(navigator.platform.indexOf("Win") != -1){
                return str;
            }
            for (var i = 0; i < str.length; i++) {
                if (alpha.indexOf(str[i]) == -1) {
                    result += "\\" + str[i];
                } else {
                    result += str[i];
                }
            }
            return result;
        },
        //解析 RPC地址 返回验证数据 和地址
        parseAuth:function(url){
            var auth_str = request_auth(url);
            if (auth_str) {
                if(auth_str.indexOf('token:') != 0){
                    auth_str = "Basic " + btoa(auth_str);
                }  
            }
            url=remove_auth(url);
            function request_auth(url) {
                return url.match(/^(?:(?![^:@]+:[^:@\/]*@)[^:\/?#.]+:)?(?:\/\/)?(?:([^:@]*(?::[^:@]*)?)?@)?/)[1];
            }
            function remove_auth(url) {
                return url.replace(/^((?![^:@]+:[^:@\/]*@)[^:\/?#.]+:)?(\/\/)?(?:(?:[^:@]*(?::[^:@]*)?)?@)?(.*)/, '$1$2$3');
            }
            return [auth_str,url];
        },
        //names format  [{"site": "http://pan.baidu.com/", "name": "BDUSS"},{"site": "http://pcs.baidu.com/", "name": "pcsett"}]
        requestCookies:function(names){
            CONNECT.sendToBackground("get_cookies",names);
        },
        setCookies:function(value){
            cookies=value;
        },
        //获取 http header信息
        getHeader:function(type){
            var addheader = [];
            var UA =localStorage.getItem("UA") || defaultUA;
            var headers = localStorage.getItem("headers");
            var referer = localStorage.getItem("referer") || defaultreferer;
            addheader.push("User-Agent: " + UA);
            addheader.push("Referer: " + referer);
            if (headers) {
                var text = headers.split("\n");
                for (var i = 0; i < text.length; i++) {
                    addheader.push(text[i]);
                }
            }
            if(cookies){
                var baidu_cookies=cookies;
                var format_cookies=[];
                for(var i=0;i<baidu_cookies.length;i++){
                    for(var key in baidu_cookies[i]){
                        format_cookies.push(key +"=" +baidu_cookies[i][key]);
                    }
                }
                addheader.push("Cookie: " + format_cookies.join(";"));
            }

            var header = "";
            if (type == "aria2c_line") {
                for (var i = 0; i < addheader.length; i++) {
                    header += " --header " + JSON.stringify(addheader[i]) + " ";
                }
                return header;
            } else if (type == "aria2c_txt") {
                for (var i = 0; i < addheader.length; i++) {
                    header += " header=" + (addheader[i]) + " \n";
                }
                return header;
            } else if (type == "idm_txt") {
                for (var i = 0; i < addheader.length; i++) {
                    header += " header=" + (addheader[i]) + " \n";
                }
                return header;
            } else {
                return addheader;
            }

        },
        //调整元素的位置使元素居中
        setCenter:function(obj){
                var screenWidth = $(window).width(), screenHeight = $(window).height();
                var scrolltop = $(document).scrollTop();
                var objLeft = (screenWidth - obj.width())/2 ;
                var objTop = (screenHeight - obj.height())/2 + scrolltop;
                obj.css({left: objLeft + 'px', top: objTop + 'px'});
        },
        //导出菜单
        addMenu:{
            init:function(type){
                if($("#export_menu").length != 0){
                    return $("#export_menu");
                }
                var aria2_btn = $("<span>").addClass("icon-btn-device").css("float", "none").attr("id","export_menu");
                var list = $("<div>").addClass("menu").attr("id", "aria2_list").appendTo(aria2_btn);
                //var aria2_export = $("<a>").text("ARIA2 RPC").attr("id", "aria2_rpc").appendTo(list);
                var aria2_download = $("<a>").text("导出下载").attr("id", "aria2_download").appendTo(list);
                var config = $("<a>").text("设置").appendTo(list);
                if(type == "home"){
                    aria2_btn.append($("<span>").text("导出下载").addClass("text").before($("<span>").addClass("ico")).after($("<span>").addClass("ico-more")));
                    $(".icon-btn-device").after(aria2_btn);
                }else if (type == "share"){
                    aria2_btn.addClass("new-dbtn").append('<em class="global-icon-download"></em><b>导出下载</b>');
                    //convert_btn.addClass("new-dbtn").append('<em class="global-icon-download"></em><b>批量转存</b>');
                    $('span a[class="new-dbtn"]').parent().prepend(aria2_btn);
                }else if(type == "album"){
                    aria2_btn.addClass("new-dbtn").append('<em class="global-icon-download"></em><b>导出下载</b>');
                    $("#albumFileSaveKey").parent().prepend(aria2_btn);
                }
                aria2_btn.on("mouseover",function(){
                    list.show();
                });
                aria2_btn.on("mouseout",function(){
                    list.hide();
                });
                config.on("click",function(){
                    if($("#setting_div").length == 0){
                        CORE.setting.init();
                    }
                     $("#setting_div").show();
                });
                this.update();
                return aria2_btn;
            },
            //根据设置更新按钮
            update:function(){
                var self=this;
                $(".rpc_export_list").remove();
                var rpc_list=JSON.parse(localStorage.getItem("rpc_list")||'[{"name":"ARIA2 RPC","url":"http://localhost:6800/jsonrpc"}]');
                while(rpc_list.length > 0){
                    var rpcObj = rpc_list.pop();
                    $("<a class='rpc_export_list'>").attr('data-id',rpcObj.url).text(rpcObj.name).prependTo($("#aria2_list"));
                }
            },
        },
        //设置界面
        setting:{
            init:function(){
                var self = this;
                var setting_div = document.createElement("div");
                setting_div.className = "b-panel b-dialog download-mgr-dialog";
                setting_div.id = "setting_div";
                if($("#setting_div").length != 0){
                    return setting_div.id;
                }
                var html_ = [
                    '<div class="dlg-hd b-rlv"><div title="关闭" id="setting_div_close" class="dlg-cnr dlg-cnr-r"></div><h3>导出设置</h3></div>',
                    '<div class="dlg-bd clearfix" style=" margin: 20px 10px 10px 10px; ">',
                    '<div id="setting_divtopmsg" style="position:absolute; margin-top: -18px; margin-left: 10px; color: #E15F00;"></div>',
                    '<table id="setting_div_table" >',
                    '<tbody>',
                    '<tr><td><label>文件夹结构层数：</label></td><td><input type="text" id="rpc_fold" class="input-small">(默认0表示不保留,-1表示保留完整路径)</td></tr>',
                    '<tr><td><label>递归下载延迟：</label></td><td><input type="text" id="rpc_delay" class="input-small">(单位:毫秒)<div style="position:absolute; margin-top: -20px; right: 20px;"></div></td></tr>',
                    '<tr><td><label>下载路径:</label></td><td><input type="text" placeholder="只能设置为绝对路径" id="setting_aria2_dir" class="input-large"></td></tr>',
                    '<tr><td><label>User-Agent :</label></td><td><input type="text" id="setting_aria2_useragent_input" class="input-large"></td></tr>',
                    '<tr><td><label>Referer ：</label></td><td><input type="text" id="setting_aria2_referer_input" class="input-large"></td></tr>',
                    '<tr><td colspan="2"><div style="color: #656565;">Headers<label style="margin-left: 65px;">※使用回车分隔每个headers。</label></div><li class="b-list-item separator-1"></li></td></tr>',
                    '<tr><td><label>headers ：</label></td><td><textarea id="setting_aria2_headers" ></textarea></td></tr>',
                    '</tbody>',
                    '</table>',
                    '<div style="margin-top:10px;">',
                    '<div id="copyright">© Copyright <a href="https://github.com/acgotaku/BaiduExporter">雪月秋水 </a><br/> Version:' + version + ' 更新日期: ' + update_date + ' </div>',
                    '<div style="margin-left:50px; display:inline-block"><a href="javascript:;" id="apply" class="button">应用</a><a href="javascript:;" id="reset" class="button">重置</a></div>',
                    '</div>',
                    '</div>'
                ];
                setting_div.innerHTML = html_.join("");
                document.body.appendChild(setting_div);
                $("#setting_divtopmsg").html("");
                self.update();
                $("#setting_div").on("click",function(event){
                    switch(event.target.id){
                        case "setting_div_close":
                            $("#setting_div").hide();
                            break;
                        case "apply":
                            self.save();
                            CORE.addMenu.update();
                            $("#setting_divtopmsg").html("设置已保存.");
                            break;
                        case "reset":
                            localStorage.clear();
                            $("#setting_divtopmsg").html("设置已重置.");
                            self.update();
                            break;
                        case "send_test":
                            //待其它模块完善再添加
                            break;
                        case "add_rpc":
                        var num=$(".rpc_list").length+1;
                        var row='<tr class="rpc_list"><td width="100"><input id="rpc_name_'+num+'" type="text" value="ARIA2 RPC '+num+'" class="input-medium">：</td><td><input id="rpc_url_'+num+'" type="text" class="input-large"></td></tr>';
                        $(row).insertAfter($(".rpc_list").eq(num-2));
                            break;
                        default:
                            //console.log(event);

                    }
                });
                CORE.setCenter($("#setting_div"));
                return setting_div.id;
            },
            //保存配置数据
            save:function(){
                var config_data=[];
                localStorage.setItem("UA", document.getElementById("setting_aria2_useragent_input").value);
                localStorage.setItem("rpc_delay", $("#rpc_delay").val());
                localStorage.setItem("referer", $("#setting_aria2_referer_input").val());
                localStorage.setItem("rpc_dir", $("#setting_aria2_dir").val());
                localStorage.setItem("rpc_fold", $("#rpc_fold").val());
                localStorage.setItem("rpc_headers", $("#setting_aria2_headers").val());

                config_data.push({"UA":document.getElementById("setting_aria2_useragent_input").value});
                config_data.push({"rpc_delay": $("#rpc_delay").val()});
                config_data.push({"referer": $("#setting_aria2_referer_input").val()});
                config_data.push({"rpc_dir": $("#setting_aria2_dir").val()});
                config_data.push({"rpc_fold":$("#rpc_fold").val()});
                config_data.push({"rpc_headers": $("#setting_aria2_headers").val()});
                var rpc_list=[];
                for(var i=0;i<$(".rpc_list").length;i++){
                    var num=i+1;
                    if($("#rpc_url_"+num).val()!= ""&&$("#rpc_name_"+num).val()!= ""){
                        rpc_list.push({"name":$("#rpc_name_"+num).val(),"url":$("#rpc_url_"+num).val()});
                    }
                }
                localStorage.setItem("rpc_list", JSON.stringify(rpc_list));
                config_data.push({"rpc_list":JSON.stringify(rpc_list)});
                CONNECT.sendToBackground("config_data",config_data);
            },
            //根据配置数据 更新 设置菜单
            update:function(){
                $("#rpc_delay").val((localStorage.getItem("rpc_delay") || "300"));
                $("#rpc_fold").val((localStorage.getItem("rpc_fold") || "0"));
                $("#setting_aria2_dir").val(localStorage.getItem("rpc_dir"));
                $("#setting_aria2_useragent_input").val(localStorage.getItem("UA") || defaultUA);
                $("#setting_aria2_referer_input").val(localStorage.getItem("referer") || defaultreferer);
                $("#setting_aria2_headers").val(localStorage.getItem("rpc_headers"));
                var rpc_list=JSON.parse(localStorage.getItem("rpc_list")||'[{"name":"ARIA2 RPC","url":"http://localhost:6800/jsonrpc"}]');
                $(".rpc_list").remove();
                for(var i in rpc_list){
                    var num=(+i)+1;
                    var addBtn=1==num?'<a id="add_rpc" href="javascript:;" >ADD RPC</a>':'';
                    var row='<tr class="rpc_list"><td width="100"><input id="rpc_name_'+num+'" type="text" value="'+rpc_list[i]['name']+'" class="input-medium">：</td><td><input id="rpc_url_'+num+'" type="text" class="input-large" value="'+rpc_list[i]['url']+'">'+addBtn+'</td></tr>';
                    if($(".rpc_list").length>0){
                        $(row).insertAfter($(".rpc_list").eq(num-2));
                    }else{
                        $(row).prependTo($("#setting_div_table>tbody"));
                    }
                }
            }
        },
        //把要下载的link和name作为数组对象传过来
        aria2Data:function(file_list,token){
            var rpc_list=[];
            var self=this;
            if (file_list.length > 0) {
                var length = file_list.length;
                for (var i = 0; i < length; i++) {
                    var rpc_data = {
                        "jsonrpc": "2.0",
                        "method": "aria2.addUri",
                        "id": new Date().getTime(),
                        "params": [[file_list[i].link], {
                                "out": file_list[i].name,
                                "dir":localStorage.getItem("rpc_dir")||null,
                                "header": self.getHeader()
                            }
                        ]
                    };
                    if (token && token.indexOf('token:') == 0) {
                        rpc_data.params.unshift(token);
                    }
                    rpc_list.push(rpc_data);
                }
            }
            return rpc_list;
        },
        //文本模式的导出数据框
        dataBox:{
            init:function(type){
                if ($("#download_ui").length == 0) {
                    var download_ui = $("<div>").attr("id", "download_ui").addClass("b-panel b-dialog download-mgr-dialog common-dialog").append('<div class="dlg-hd b-rlv"><span class="dlg-cnr dlg-cnr-l"></span><a href="javascript:;" title="关闭" id="aria2_download_close" class="dlg-cnr dlg-cnr-r"></a><h3><em></em>ARIA2导出</h3></div>');
                    var content_ui = $("<div>").addClass("content").attr("id", "content_ui").appendTo(download_ui);
                    download_ui.appendTo($("body"));
                    content_ui.empty();
                    var download_menu = $("<div>").addClass("module-list-toolbar").css({"display": "block", "margin-bottom": "10px"}).appendTo(content_ui);
                    if (type == "home") {
                        var aria2c_btn = $("<a>").attr("id", "aria2c_btn").attr({"href": "data:text/plain;charset=utf-8,", "download": "aria2c.down", "target": "_blank"}).addClass("btn download-btn").append($("<span>").addClass("ico")).append($("<span>").addClass("btn-val").text("存为aria2文件")).appendTo(download_menu);
                        var idm_btn = $("<a>").attr("id", "idm_btn").attr({"href": "data:text/plain;charset=utf-8,", "download": "idm.txt", "target": "_blank"}).addClass("btn download-btn").append($("<span>").addClass("ico")).append($("<span>").addClass("btn-val").text("存为IDM文件")).appendTo(download_menu);
                        var download_txt_btn = $("<a>").attr("id", "download_txt_btn").attr({"href": "data:text/plain;charset=utf-8,", "download": "download_link.txt", "target": "_blank"}).addClass("btn download-btn").append($("<span>").addClass("ico")).append($("<span>").addClass("btn-val").text("保存下载链接")).appendTo(download_menu);
                        var download_link = $("<textarea>").attr("wrap", "off").attr("id", "download_link").css({ "width": "100%", "overflow": "scroll", "height": "180px"}).appendTo(content_ui);;

                    } else {
                        var aria2c_btn = $("<a>").attr("id", "aria2c_btn").attr({"href": "data:text/plain;charset=utf-8,", "download": "aria2c.down", "target": "_blank"}).addClass("new-dbtn").html('<em class="global-icon-download"></em><b>存为aria2文件</b>').appendTo(download_menu);
                        var idm_btn = $("<a>").attr("id", "idm_btn").attr({"href": "data:text/plain;charset=utf-8,", "download": "idm.txt", "target": "_blank"}).addClass("new-dbtn").html('<em class="global-icon-download"></em><b>存为IDM文件</b>').appendTo(download_menu);
                        var download_txt_btn = $("<a>").attr("id", "download_txt_btn").attr({"href": "data:text/plain;charset=utf-8,", "download": "download_link.txt", "target": "_blank"}).addClass("new-dbtn").html('<em class="global-icon-download"></em><b>保存下载链接</b>').appendTo(download_menu);
                        var download_link = $("<textarea>").attr("wrap", "off").attr("id", "download_link").css({ "width": "100%", "overflow": "scroll", "height": "180px"}).appendTo(content_ui);;
                    }
                    CORE.setCenter($("#download_ui"));
                    $("#download_ui").on("click","#aria2_download_close",function(){
                        download_ui.hide();
                    });
                }else{
                    $("#aria2c_btn, #idm_btn, #download_txt_btn").attr("href", "data:text/plain;charset=utf-8,");
                    $("#download_link").val("");
                }
                return this;
            },
            show:function(){
                $("#download_ui").show();
            },
            //在数据框里面填充数据
            fillData:function(file_list){
                var files = [];
                var aria2c_txt = [];
                var idm_txt = [];
                var down_txt = [];
                if (file_list.length > 0) {
                    var length = file_list.length;
                    for (var i = 0; i < length; i++) {
                        filename = (navigator.platform.indexOf("Win") != -1) ? JSON.stringify(file_list[i].name) : CORE.escapeString(file_list[i].name);
                        files.push("aria2c -c -s10 -k1M -x10 -o " + filename + CORE.getHeader('aria2c_line') + " " + JSON.stringify(file_list[i].link) + "\n");
                        aria2c_txt.push([
                            file_list[i].link,
                            CORE.getHeader("aria2c_txt"),
                            ' out=' + file_list[i].name,
                            ' continue=true',
                            ' max-connection-per-server=10',
                            '  split=10',
                            '\n'
                        ].join('\n'));
                        idm_txt.push([
                            '<',
                            file_list[i].link,
                            ' out=' + file_list[i].name,
                            ' >'
                        ].join('\r\n'));
                        down_txt.push([file_list[i].link, ' '].join('\n'));
                    }
                    $("#aria2c_btn").attr("href", $("#aria2c_btn").attr("href") + encodeURIComponent(aria2c_txt.join("")));
                    $("#idm_btn").attr("href", $("#idm_btn").attr("href") + encodeURIComponent(idm_txt.join("")));
                    $("#download_txt_btn").attr("href", $("#download_txt_btn").attr("href") + encodeURIComponent(down_txt.join("")));
                    $("#download_link").val($("#download_link").val() + files.join(""));
                }
            }
        },


    }
})();