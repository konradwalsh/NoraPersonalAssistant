# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy solution and all project files
COPY NoraPA.sln ./
COPY src/NoraPA.Core/NoraPA.Core.csproj ./src/NoraPA.Core/
COPY src/NoraPA.Infrastructure/NoraPA.Infrastructure.csproj ./src/NoraPA.Infrastructure/
COPY src/NoraPA.API/NoraPA.API.csproj ./src/NoraPA.API/

# Restore dependencies
RUN dotnet restore

# Copy all source code
COPY src/ ./src/

# Build the project
RUN dotnet build -c Release --no-restore

# Publish the API
RUN dotnet publish src/NoraPA.API/NoraPA.API.csproj -c Release -o /app/publish --no-restore

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

# Expose port
EXPOSE 5000

# Set environment variables
ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_ENVIRONMENT=Production

# Run the application
ENTRYPOINT ["dotnet", "NoraPA.API.dll"]
