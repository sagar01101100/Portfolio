# Portfolio database configuration

The application uses Entity Framework Core with Microsoft SQL Server. The database schema is managed by the SQL script run in SSMS; the app does not automatically create, drop, or migrate tables at startup.

## Configure the connection string

Do not commit database passwords or production connection strings to Git.

### Windows PowerShell

Replace the server/instance name and authentication details with the values for the SQL Server where `PortfolioDB` was created:

```powershell
$env:ConnectionStrings__PortfolioDb = "Server=YOUR_SQL_SERVER;Database=PortfolioDB;User ID=YOUR_SQL_LOGIN;Password=YOUR_PASSWORD;Encrypt=True;TrustServerCertificate=False;"
dotnet run
```

For local SQL Server using Windows authentication, use the correct local instance:

```powershell
$env:ConnectionStrings__PortfolioDb = "Server=YOUR_SERVER_INSTANCE;Database=PortfolioDB;Integrated Security=True;Encrypt=True;TrustServerCertificate=True;"
dotnet run
```

Use `TrustServerCertificate=True` only for local development where you understand the certificate implications. For production, validate the SQL Server TLS certificate.

### AWS deployment

Set `ConnectionStrings__PortfolioDb` as a protected environment variable in the backend hosting environment or secret manager. Do not add it to `appsettings.json`, commit it, or expose it in frontend code.

For RDS SQL Server, allow inbound TCP 1433 from the backend server's security group. Keep the database private where possible; do not open SQL Server to the entire internet.

## Verify the connection

Run the ASP.NET Core backend and request:

```text
GET /api/database/health
```

A successful response:

```json
{
  "status": "ok",
  "database": "PortfolioDB",
  "connected": true
}
```

If the connection string is missing or SQL Server cannot be reached, the endpoint returns HTTP 503 without exposing credentials or exception details.

## Hosting note

Netlify currently publishes static files from `wwwroot`; it does not run this ASP.NET Core application as a .NET API server. Deploy the ASP.NET Core backend separately (for example, on AWS), then configure the frontend to call that backend's HTTPS API URL. The CORS policy allows `https://s3r.netlify.app` and local development origins.
