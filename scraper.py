import mydb
import requests
import traceback
import datetime
import time
import json

now = datetime.datetime.now()
r = requests.get(mydb.STATIONS_URI, params={"apiKey": mydb.JCKEY, "contract": mydb.NAME})

# function to update database
def write_to_db(text):
    stations = json.loads(text)
    for station in stations:
        vals = (station.get('address'), int(station.get('banking')), station.get('bike_stands'), int(station.get('bonus')),
                station.get('contract_name'), station.get('name'), station.get('number'), station.get('position').get('lat'), 
                station.get('position').get('lng'))
        mydb.engine.execute("insert into station values(%s,%s,%s,%s,%s,%s,%s,%s,%s)", vals)
        dynamic_vals = (station.get('number'), station.get('available_bikes'), station.get('available_bike_stands'), 
                        station.get('status'), int(station.get('last_update')) / 1000)
        mydb.engine.execute("insert into availability values(%s,%s,%s,%s,%s)", dynamic_vals)    
    return

def main():
    while True:
        try:
            write_to_db(r.text)
            time.sleep(5*60)
        except:
            print(traceback.format_exc())
    return

main()