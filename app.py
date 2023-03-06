from flask import Flask, render_template, jsonify
import functools
from sqlalchemy import create_engine, text
import traceback
import dbinfo

app = Flask(__name__)

@app.route("/")
def index():
    return render_template('index.html', gmkey=dbinfo.GMKEY)


@app.route("/stations")
@functools.lru_cache(maxsize=128)
def get_stations():
    engine = create_engine("mysql+mysqldb://{}:{}@{}:{}/{}".format(dbinfo.USER, dbinfo.PASSWORD, dbinfo.DB_URI, dbinfo.PORT, dbinfo.DB_NAME), echo=True)
    sql = "select * from station;"
    try:
        with engine.connect() as conn:
            rows = conn.execute(text(sql)).fetchall()
            print('#found {} stations', len(rows), rows)
            return jsonify([row._asdict() for row in rows])
    except:
        print(traceback.format_exc())
        return "error in get_stations", 404


if __name__ == "__main__":
    app.run(debug=True)