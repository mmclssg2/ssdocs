BalsamiqSearchAutoComplete = {};
BalsamiqSearchAutoComplete.domains = [
	{url:'support.balsamiq.com', label:'our Support Portal'},
	{url:'docs.balsamiq.com', label:'the Docs'},
	{url:'balsamiq.com', label:'our Website'},
	{url:'www.uxapprentice.com', label:'UX Apprentice'},
	{url:'wireframestogo.com', label:'Wireframes To Go'},
	{url:'blog.balsamiq.com', label:'our Blog'},
	{url:'forums.balsamiq.com', label:'our Forums'}
];

BAC = function(searching, results, bindToEsc)
{
	var thisdomain = window.location.href.split("/")[2].split(":")[0];
	if (thisdomain == 'balsamiq.com') {
		thisdomain = 'support.balsamiq.com';
	}
	this.firstDomain = (thisdomain === "localhost") ? "balsamiq.com" : thisdomain;

	this.searching = searching;
	this.results = results;

	this.bindToEsc = bindToEsc;
};

BAC.prototype.showSearching = function(p_showIt)
{
	this.searching.css("visibility", p_showIt ? "visible" : "hidden");
};

BAC.prototype.closeOnEsc = function(e)
{
	if (e.keyCode === 27) { // escape key maps to keycode `27`
		this.showSearching(false);
		this.showResults(false);
	}
};

BAC.prototype.showResults = function(p_showIt)
{
	this.results.css("visibility", p_showIt ? "visible" : "hidden");

	if (this.bindToEsc) {
		if (p_showIt)
		{
			$(document).keyup(this.closeOnEsc.bind(this));
		}
		else
		{
			$(document).unbind("keyup", this.closeOnEsc);
		}
	}
};

BAC.prototype.doSearch = function(p_string)
{
	if (p_string === null || p_string === "" || p_string.length < 2) {
		this.results.css("visibility", "hidden");
		return;
	}

	this.searching.html("<img src='//media.balsamiq.com/img/loading.gif' alt='Searching...'>");
	this.showSearching(true);
	$.ajax({
		url: "https://api.swiftype.com/api/v1/public/engines/search?q="+p_string+"&engine_key=3UDzEcC5dkC9USWUiuxX",
		dataType: 'jsonp',
		success: function (data) {
			var res = data.records.page;

			if (data.record_count === 0) {
				this.searching.html("<span class='noresult'>No results</span>");
				this.showResults(false);
				return;
			}

			this.showResults(true);
			this.showSearching(false);

			//var resultsByDomain = {};
			var i;
			var page;

			var list = "<ul style='list-style-type: none; padding-left: 0;'>";

			var topList = "";
			var forumsList = "";
			var blogList = "";
			var wtgList = "";

			for (i=0; i<data.records.page.length; i++) {
				page = res[i];

				var title = page.title;
				title = title.replace(/ \| Balsamiq$/, " | balsamiq.com");
				title = title.replace(/ - Balsamiq Documentation$/, " | Documentation");
				title = title.replace(/ - Balsamiq Support Portal$/, " | Support");
				title = title.replace(/ – The Balsamiq Blog – Balsamiq$/, " | Blog");
				title = title.replace(/ - Balsamiq Community Discussion$/, " | Forums");

				var highlight = "";
				if (page.highlight.title && page.highlight.body) {
					highlight = page.highlight.body.replace(/em>/g, "b>");
				} else {
					if (page.highlight.sections) {
						highlight = page.highlight.sections.replace(/em>/g, "b>");
					} else if (page.highlight.body) {
						highlight = page.highlight.body.replace(/em>/g, "b>");
					}
				}

				var item = "<li><h4><a href='"+page.url+"'>"+title+"</a></h4><small class='search-url'><a href='"+page.url+"'>"+page.url+"</a></small><small class='search-highlight'>"+highlight+"</small></li>\n";
				if (page.url.indexOf("forums.balsamiq.com") != -1) {
					forumsList += item;
				} else if (page.url.indexOf("blog.balsamiq.com") != -1) {
					blogList += item;
				} else if (page.url.indexOf("wireframestogo.com") != -1) {
					wtgList += item;
				} else {
					topList += item;
				}
			}

			list += topList + wtgList + blogList + forumsList + "</ul>\n";

			this.results.html(list);
		}.bind(this),
		error: function(data) {
			this.searching.html("Error searching");
			this.showResults(false);
		}.bind(this)
	});
};

//The div has to have an input component in it
BalsamiqSearchAutoComplete.initAutoCompleteInputDiv = function(divID)
{
	var input = $("#"+divID+" input");

	$("#"+divID).append("<div id='searching'>Searching...</div>");
	var searching = $("#"+divID+" #searching");

	$("#"+divID).append("<div id='results' style='text-align:left'></div>");
	var results = $("#"+divID+" #results");

	var bac = new BAC(searching, results, true);

	var pendingSendTimer;

	input.on('input', function()
	{
		bac.showSearching(false);
		bac.showResults(false);

		if (pendingSendTimer != null) {
			//Stop the previous send
			clearInterval(pendingSendTimer);
		}
		//Start a new delayed send
		pendingSendTimer = setInterval(	function(){
			clearInterval(pendingSendTimer);
			bac.doSearch(input.val());
		}, 250);
	});

	input.on("keypress", function(e)
	{
		if (e.keyCode == 13)
		{
			window.location.href = "https://balsamiq.com/search/?q="+input.val();
			return false;
		}
	});
};

BalsamiqSearchAutoComplete.initWithSearch = function(query, searchingDiv, resultsDiv)
{
	var bac = new BAC(searchingDiv, resultsDiv, false);
	bac.doSearch(query);
};
