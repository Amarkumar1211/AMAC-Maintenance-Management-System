using System.Text;
using MBMS.API.Hubs;
using MBMS.API.Services;
using MBMS.Application.Interfaces;
using MBMS.Infrastructure.Data;
using MBMS.Infrastructure.Security;
using MBMS.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// 1. Database Connection
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Server=localhost;Database=MBMS_Production;Integrated Security=True;TrustServerCertificate=True;";

builder.Services.AddDbContext<MBMSDbContext>(options =>
    options.UseSqlServer(connectionString, sqlOptions =>
    {
        sqlOptions.EnableRetryOnFailure(3);
    }));

// 2. Application & Infrastructure Services
builder.Services.AddSingleton<IPasswordHasher, PasswordHasher>();
builder.Services.AddSingleton<IFileStorageService, FileStorageService>();
builder.Services.AddSingleton<IQRService, QRCodeService>();

builder.Services.AddScoped<ITicketNumberGenerator, TicketNumberGenerator>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IMasterService, MasterService>();
builder.Services.AddScoped<ITicketService, TicketService>();
builder.Services.AddScoped<IReportingService, ReportingService>();
builder.Services.AddScoped<INotificationService, SignalRNotificationService>();

// 3. SignalR for Real-time factory LAN updates
builder.Services.AddSignalR();

// 4. JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"] ?? "MBMS_SuperSecret_Factory_LAN_Key_2026_Industrial_Security_Production!";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "MBMS.API";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "MBMS.Client";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false; // Factory LAN
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };

    // Support token in query string for SignalR hub and file view
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

// 5. CORS for Factory LAN & Local React Client
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAllFactoryLAN", policy =>
    {
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

var app = builder.Build();

// 6. Automatic Database Seeding
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var db = services.GetRequiredService<MBMSDbContext>();
        var hasher = services.GetRequiredService<IPasswordHasher>();
        var qrService = services.GetRequiredService<IQRService>();
        await DbInitializer.InitializeAsync(db, hasher, qrService);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while seeding the database.");
    }
}

app.UseCors("AllowAllFactoryLAN");

// Global Domain Exception Middleware for Airtight Factory Workflow Validation
app.Use(async (context, next) =>
{
    try
    {
        await next();
    }
    catch (KeyNotFoundException knf)
    {
        context.Response.StatusCode = StatusCodes.Status404NotFound;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(new { message = knf.Message });
    }
    catch (UnauthorizedAccessException uae)
    {
        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(new { message = uae.Message });
    }
    catch (InvalidOperationException ioe)
    {
        context.Response.StatusCode = StatusCodes.Status400BadRequest;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(new { message = ioe.Message });
    }
    catch (ArgumentException ae)
    {
        context.Response.StatusCode = StatusCodes.Status400BadRequest;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(new { message = ae.Message });
    }
});

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<NotificationHub>("/hubs/notifications");

// Root Health & System Info Endpoint
app.MapGet("/", () => Results.Ok(new
{
    System = "Machine Breakdown & Maintenance Management System (MBMS)",
    Environment = "Factory LAN",
    Version = "1.0",
    Status = "Healthy",
    ServerTime = DateTime.UtcNow
}));

app.Run();
