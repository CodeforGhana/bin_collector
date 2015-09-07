 $( document ).ajaxSend(function(evt, req, opt) {
            if(window.apikey!=undefined)
          req.setRequestHeader('Authorization',window.apikey);
      });