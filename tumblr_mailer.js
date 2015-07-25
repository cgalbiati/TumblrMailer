var fs = require('fs');
var csvFile = fs.readFileSync("friend_list.csv", 'utf8');
var ejs = require('ejs');
var emailTemplate = fs.readFileSync("email_template.ejs", 'utf8');
var tumblr = require('tumblr.js');
var client = tumblr.createClient({
  consumer_key: 'x',
  consumer_secret: 'x',
  token: 'x',
  token_secret: 'x'
});
var mandrill = require('mandrill-api/mandrill');
var mandrill_client = new mandrill.Mandrill('x');


function csvParse(csvFile) {
	var csv_data = [];
	var linesArray = csvFile.split('\n');
	var keys = linesArray[0].split(',');
	for (i=1; i<linesArray.length; i++) {
		var keyArray = linesArray[i].split(',');
		var csvObj = {}
		for (j=0; j<keys.length; j++) {
			csvObj[keys[j]] = keyArray[j];
		}
		csv_data.push(csvObj);
	}
	return csv_data;
}

function filterLatest(blogObj) {
	var latestPosts = [];
	var currentDateTimestamp = Date.now() / 1000 | 0;
	for (i=0; i<blogObj.posts.length; i++){
		if (currentDateTimestamp - blogObj.posts[i].timestamp <= 604800) {
			latestPosts.push(blogObj.posts[i]);
		}
	}
	return latestPosts;
}

var friendList = csvParse(csvFile);
var blogObj = {};
client.posts('cgalbiati.tumblr.com', function(err, blog){
	blogObj = blog;
	var latestPosts = filterLatest(blogObj);

	friendList.forEach(function(row){
	    var firstName = row["firstName"];
	    var numMonthsSinceContact = row["numMonthsSinceContact"];
	    var emailAddress = row['emailAddress'];
		var customizedTemplate = ejs.render(emailTemplate, 
			{	firstName: firstName, 
				numMonthsSinceContact: numMonthsSinceContact,
				latestPosts: latestPosts
			});
		sendEmail(firstName, emailAddress, 'Chandra', 'chandra.galbiati@gmail.com', 'Check out my Programming Blog', customizedTemplate);
	});
});

function sendEmail(to_name, to_email, from_name, from_email, subject, message_html){
    var message = {
        "html": message_html,
        "subject": subject,
        "from_email": from_email,
        "from_name": from_name,
        "to": [{
                "email": to_email,
                "name": to_name
            }],
        "important": false,
        "track_opens": true,    
        "auto_html": false,
        "preserve_recipients": true,
        "merge": false,
        "tags": [
            "Fullstack_Tumblrmailer_Workshop"
        ]    
    };
    var async = false;
    var ip_pool = "Main Pool";
    mandrill_client.messages.send({"message": message, "async": async, "ip_pool": ip_pool}, function(result) {
        // console.log(message);
        // console.log(result);   
    }, function(e) {
        // Mandrill returns the error as an object with name and message keys
        console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
        // A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
    });
 }


