import requests
import json

r = requests.get("http://metwdb-openaccess.ichec.ie/metno-wdb2ts/locationforecast?lat=53.3498;long=-6.2603")
print(json.loads(r.text))