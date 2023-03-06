import dbinfo
import requests
import json
from sqlalchemy import create_engine, text
import traceback
from datetime import datetime

engine = create_engine("mysql+mysqldb://{}:{}@{}:{}/{}".format(dbinfo.USER, dbinfo.PASSWORD, dbinfo.DB_URI, dbinfo.PORT, dbinfo.DB_NAME), echo=True)

with engine.begin() as connection:

    connection.execute(text("USE dublinbikes"))
    
    createCurrentWeatherTable = """CREATE TABLE IF NOT EXISTS current_weather (
                    dt BIGINT,
                    main_weather VARCHAR(256),
                    weather_desc VARCHAR(256),
                    sunrise BIGINT,
                    sunset BIGINT,
                    temp FLOAT,
                    visibility INT,
                    wind_speed FLOAT,
                    wind_deg INT,
                    timestamp BIGINT
                    )
                    """

    try:
        connection.execute(text(createCurrentWeatherTable))
    except Exception as e:
        print(e)

def main():
    try:
        now = datetime.now()
        timestamp = datetime.timestamp(now)
        r = requests.get(dbinfo.WEATHER_URI, params={"lat":dbinfo.LAT, "lon":dbinfo.LON, "exclude":dbinfo.EXCLUDE, "appid":dbinfo.APP_ID})
        api_to_db(r.text, timestamp)
    except:
        print(traceback.format_exc())
        if connection is None:
            return

def api_to_db(apiData, timestamp):
    weather = json.loads(apiData)
    with engine.begin() as connection:
        weather_info = (
            weather.get('current').get('dt'),
            weather.get('current').get('weather')[0].get('main'),
            weather.get('current').get('weather')[0].get('description'), 
            weather.get('current').get('sunrise'), 
            weather.get('current').get('sunset'),
            weather.get('current').get('temp'),
            weather.get('current').get('visibility'), 
            weather.get('current').get('wind_speed'), 
            weather.get('current').get('wind_deg'), 
            timestamp
            )
            
        try:
            weather_insert_row = """INSERT INTO current_weather VALUES("%s", "%s", "%s", "%s", "%s", "%s", "%s", "%s", "%s", "%s")"""
            weather_insert_row = weather_insert_row % weather_info
            connection.execute(text(weather_insert_row))

        except Exception as e:
            print(e)
        
        return

main()        