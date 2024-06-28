import pandas as pd
from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import os
from sqlalchemy import create_engine
from sqlalchemy.engine.url import URL
import logging

# Set up logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)


class SQLExtractor:
    def __init__(self):
        self.engine = self.create_engine()

    def create_engine(self):
        # Load environment variables
        SQL_SERVER = "localhost\\SQLEXPRESS"
        SQL_DATABASE = "DisruptionMonitoring"
        SQL_TRUSTED_CONNECTION = "yes"
        DRIVER = "{ODBC Driver 17 for SQL Server}"

        # Construct connection string
        connection_string = f"DRIVER={DRIVER};SERVER={SQL_SERVER};DATABASE={SQL_DATABASE};Trusted_Connection={SQL_TRUSTED_CONNECTION};"

        connection_url = URL.create(
            "mssql+pyodbc", query={"odbc_connect": connection_string}
        )

        try:
            engine = create_engine(connection_url)
            logging.info("Connected to SQL Server")
            return engine
        except Exception as e:
            logging.error(f"Error connecting to SQL Server: {e}")
            return None

    def load_city_data_from_sql(self) -> pd.DataFrame:
        if self.engine is None:
            logging.error("No connection to the database.")
            return None

        query = "SELECT City,Lat, Lng FROM cities_simplified_1000"
        try:
            with self.engine.connect() as connection:
                city_data = pd.read_sql(query, connection)
            return city_data
        except Exception as e:
            logging.error(f"Error reading data from SQL Server: {e}")
            return None

    def load_days_from_sql(self) -> pd.DataFrame:
        if self.engine is None:
            logging.error("No connection to the database.")
            return None

        query = "SELECT days from days"
        try:
            with self.engine.connect() as connection:
                days = pd.read_sql(query, connection)
            return days
        except Exception as e:
            logging.error(f"Error reading data from SQL Server: {e}")
            return None

    def extract_all_supplier_info(self) -> list:
        query = "SELECT * FROM suppliers"
        try:
            with self.engine.connect() as connection:
                suppliers_df = pd.read_sql(query, connection)
            suppliers = suppliers_df.to_dict("records")
            return suppliers
        except Exception as e:
            logging.error(f"Error reading data from SQL Server: {e}")
            return []

    def convert_article_data_type(self, article: dict) -> dict:
        try:
            article["lat"] = float(article.get("lat", 0))
            article["lng"] = float(article.get("lng", 0))
            article["Radius"] = float(article.get("Radius", 0))
            article["PublishedDate"] = str(
                pd.to_datetime(article.get("PublishedDate", ""))
            )
            article["created_at"] = str(pd.to_datetime(article.get("created_at", "")))
        except KeyError as e:
            logging.error(f"Key error during data type conversion: {e}")
        except ValueError as e:
            logging.error(f"Value error during data type conversion: {e}")
        return article

    def extract_all_articles(self, limit=10):
        query = f"SELECT TOP {limit} * FROM Articles"
        try:
            with self.engine.connect() as connection:
                articles_df = pd.read_sql(query, connection)
            articles = articles_df.to_dict("records")
            articles = [self.convert_article_data_type(article) for article in articles]
            return articles
        except Exception as e:
            logging.error(f"Error reading data from SQL Server: {e}")
            return []


extractor = SQLExtractor()


class RequestHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Content-Type", "application/json")  # Set Content-Type header explicitly
        self.end_headers()

        if self.path == "/city-data":
            city_data = extractor.load_city_data_from_sql()
            if city_data is not None:
                self.respond(city_data.to_dict(orient="records"))
            else:
                self.respond({"error": "Failed to load city data"})
        elif self.path == "/days":
            days = extractor.load_days_from_sql()
            if days is not None and not days.empty:
                self.respond(days)
            else:
                self.respond({"error": "No days found or failed to load days"})

        elif self.path.startswith("/articles"):
            # limit = self.get_query_param('limit', 10)
            articles = extractor.extract_all_articles()
            if articles:
                self.respond(articles)
            else:
                self.respond({"error": "No articles found or failed to load articles"})
        elif self.path == "/suppliers":
            suppliers = extractor.extract_all_supplier_info()
            if suppliers:
                self.respond(suppliers)
            else:
                self.respond(
                    {"error": "No suppliers found or failed to load suppliers"}
                )
        elif self.path == "/disruption-types":
            disruption_types = extractor.extract_all_unique_disruption_types()
            if disruption_types:
                self.respond(disruption_types)
            else:
                self.respond(
                    {
                        "error": "No disruption types found or failed to load disruption types"
                    }
                )
        else:
            self.respond({"error": "Invalid endpoint"}, status=404)

    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length).decode('utf-8')

        # Assuming post_data contains JSON payload with parameters
        try:
            payload = json.loads(post_data)

            if self.path == "/python-code":
                result = self.execute_python_code(payload)
                self.respond({"result": result})
            else:
                self.respond({"error": "Invalid endpoint"}, status=404)

        except json.JSONDecodeError as e:
            logging.error(f"Error decoding JSON: {e}")
            self.respond({"error": "Invalid JSON format"}, status=400)

    def execute_python_code(self, payload):
        # Example: Execute some custom Python logic based on the payload
        try:
            # Example: Printing the received payload
            print("Received payload:", payload)

            # Example: Perform some calculations or database operations
            # Replace with your actual Python code logic

            return "Python code executed successfully!"

        except Exception as e:
            logging.error(f"Error executing Python code: {e}")
            return f"Error: {str(e)}"

    def respond(self, data, status=200):
        try:
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.end_headers()

            # Check if data is a pandas DataFrame
            if isinstance(data, pd.DataFrame):
                # Convert DataFrame to list of dictionaries
                data = data.to_dict(orient="records")

            # Serialize the data to JSON and send it
            self.wfile.write(json.dumps(data).encode("utf-8"))
        except ConnectionAbortedError as e:
            logging.error(f"Connection aborted: {e}")


def run(server_class=HTTPServer, handler_class=RequestHandler, port=8001):
    server_address = ("", port)
    httpd = server_class(server_address, handler_class)
    logging.info(f"Starting httpd server on port {port}")
    httpd.serve_forever()


if __name__ == "__main__":
    run()