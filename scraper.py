import dbinfo
import requests
import json
from sqlalchemy import create_engine, text
import traceback
from datetime import datetime

engine = create_engine("mysql+mysqldb://{}:{}@{}:{}/{}".format(dbinfo.USER, dbinfo.PASSWORD, dbinfo.DB_URI, dbinfo.PORT, dbinfo.DB_NAME), echo=True)

with engine.begin() as connection:
    createDataBase = """CREATE DATABASE IF NOT EXISTS dublinbikes"""
    connection.execute(text(createDataBase))
    
    connection.execute(text("USE dublinbikes"))

    createStationTable = """CREATE TABLE IF NOT EXISTS station (
                    number INTEGER NOT NULL PRIMARY KEY,
                    contract_name VARCHAR(256) NOT NULL,
                    name VARCHAR(256),
                    address VARCHAR(256),
                    banking INTEGER,
                    bike_stands INTEGER,
                    bonus INTEGER,
                    position_lat REAL,
                    position_lng REAL,
                    timestamp BIGINT
                    )
                    """

    try:
        connection.execute(text("DROP TABLE IF EXISTS station"))
        connection.execute(text(createStationTable))
    except Exception as e:
        print(e)

    createAvailTable = """CREATE TABLE IF NOT EXISTS availability (
                    number INTEGER NOT NULL,
                    available_bikes INTEGER,
                    available_bike_stands INTEGER,
                    status VARCHAR(256),
                    last_update BIGINT,
                    timestamp BIGINT
                    )
                    """
    
    try:
        connection.execute(text(createAvailTable))
    except Exception as e:
        print(e)

def main():
    try:
        now = datetime.now()
        timestamp = datetime.timestamp(now)
        r = requests.get(dbinfo.STATIONS_URI, params={"apiKey":dbinfo.JCKEY, "contract":dbinfo.NAME})
        api_to_db(r.text, timestamp)
    except:
        print(traceback.format_exc())
        if connection is None:
            return

def api_to_db(apiData, timestamp):
    stations = json.loads(apiData)
    with engine.begin() as connection:
        for station in stations:
            static_vals = (
                    station.get('number'),
                    station.get('contract_name'),
                    station.get('name'),
                    station.get('address'),
                    int(station.get('banking')), 
                    station.get('bike_stands'), 
                    int(station.get('bonus')),
                    station.get('position').get('lat'),
                    station.get('position').get('lng'),
                    timestamp
                    )
            
            dynamic_vals = (
                    station.get('number'),
                    station.get('available_bikes'),
                    station.get('available_bike_stands'),
                    station.get('status'),
                    station.get('last_update'),
                    timestamp
                    )
            
            try:
                static_insert_row = """INSERT INTO station VALUES("%s", "%s", "%s", "%s", "%s", "%s", "%s", "%s", "%s", "%s")"""
                static_insert_row = static_insert_row % static_vals
                connection.execute(text(static_insert_row))

                dynamic_insert_row = """INSERT INTO availability VALUES("%s", "%s", "%s", "%s", "%s", "%s")"""
                dynamic_insert_row = dynamic_insert_row % dynamic_vals
                connection.execute(text(dynamic_insert_row))
            except Exception as e:
                print(e)
        return

main()