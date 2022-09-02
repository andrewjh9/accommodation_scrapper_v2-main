from asyncio import constants
from facebook_scraper import get_posts
from datetime import datetime
import json
import time
import winsound

RULE_OUT_KEYWORDS = ["Registration not possible", "GIRLS only", "women only", "I’m looking to rent a room","I'm looking for a room", "FEMALES ONLY", "looking for a room", "My budget is", "I'm moving", "We are moving to Amsterdam", "We would like to find a room", "We are a couple"]
PAGES_TO_CHECK_IDS = ["405276586256037", "128341160519380",  "251441185632701" ]
REQUIRED_KEYWORDS = ["room"]
MIN_CHARACTER_LENGTH = 100
NUM_PAGES_TO_CHECK = 10
number_of_posts_checked = 0


def check_page_for_new_posts(page_id, post_links):
    num_posts = 0
    posts = get_posts(page_id, pages=NUM_PAGES_TO_CHECK, options={"allow_extra_requests": False, "comments": False, "replies": False})
    for post in  posts:
        num_posts = num_posts + 1 
        global number_of_posts_checked 
        number_of_posts_checked =  number_of_posts_checked + 1 
        dt_obj = post['time']
        res_rule_out_keywords = [ele for ele in RULE_OUT_KEYWORDS if(ele.upper() in str(post['post_text']).upper())]
        res_required_keywords = [ele for ele in REQUIRED_KEYWORDS if(ele.upper() in str(post['post_text']).upper())]
        # print(post['time'], not bool(res_rule_out_keywords)  , bool(res_required_keywords) , len(post['post_text']) > MIN_CHARACTER_LENGTH , dt_obj.date() == datetime.today().date())
        if not bool(res_rule_out_keywords)  and bool(res_required_keywords) and len(post['post_text']) > MIN_CHARACTER_LENGTH :
            post_links.append(post['post_url'])
            print(post['post_url'], dt_obj)
        time.sleep(2)
post_links = []
for page_id in PAGES_TO_CHECK_IDS:
    time.sleep(60)
    check_page_for_new_posts(page_id, post_links)
    break
# write_link_to_file(post_links)
# print(post_links)
print("Bot Check "+ str(number_of_posts_checked) +" Posts")





# def write_link_to_file(post_links):
#     with open("yourfile.txt", "w") as f:
#        for post_link in post_links:
#         f.write("%s\n" %post_link)
#     jsonString = json.dumps(post_links)
#     jsonFile = open("data.json", "w")
#     jsonFile.write(jsonString)
#     jsonFile.close()
#     return
