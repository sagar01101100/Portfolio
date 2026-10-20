using Microsoft.EntityFrameworkCore;
using PortfolioWeb.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllersWithViews();

var portfolioConnectionString =
    builder.Configuration.GetConnectionString("PortfolioDb");

builder.Services.AddDbContext<PortfolioDbContext>(options =>
{
    if (!string.IsNullOrWhiteSpace(portfolioConnectionString))
    {
        options.UseSqlServer(portfolioConnectionString);
    }
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("PortfolioFrontend", policy =>
    {
        policy.WithOrigins(
                "https://s3r.netlify.app",
                "http://localhost:5000",
                "https://localhost:5001")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseRouting();
app.UseCors("PortfolioFrontend");
app.UseAuthorization();

app.MapControllers();
app.MapStaticAssets();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}")
    .WithStaticAssets();

app.Run();
