using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortfolioWeb.Data;

namespace PortfolioWeb.Controllers;

[ApiController]
[Route("api/database")]
public sealed class DatabaseHealthController(
    PortfolioDbContext db,
    IConfiguration configuration) : ControllerBase
{
    [HttpGet("health")]
    public async Task<IActionResult> GetHealth(CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(configuration.GetConnectionString("PortfolioDb")))
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new
            {
                status = "not_configured",
                message = "Set the ConnectionStrings__PortfolioDb environment variable."
            });
        }

        try
        {
            var canConnect = await db.Database.CanConnectAsync(cancellationToken);
            if (!canConnect)
            {
                return StatusCode(StatusCodes.Status503ServiceUnavailable, new
                {
                    status = "unavailable",
                    database = "PortfolioDB"
                });
            }

            return Ok(new
            {
                status = "ok",
                database = "PortfolioDB",
                connected = true
            });
        }
        catch
        {
            // Never return connection strings or database exception details to clients.
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new
            {
                status = "unavailable",
                database = "PortfolioDB"
            });
        }
    }
}
