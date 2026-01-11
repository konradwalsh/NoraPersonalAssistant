# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy solution and project files
COPY NoraPA.sln ./
COPY src/NoraPA.Core/NoraPA.Core.csproj ./src/NoraPA.Core/

# Restore dependencies
RUN dotnet restore

# Copy source code
COPY src/ ./src/

# Build the project
RUN dotnet build -c Release --no-restore

# Publish stage (for when API project is added)
# FROM build AS publish
# RUN dotnet publish src/NoraPA.API/NoraPA.API.csproj -c Release -o /app/publish --no-restore

# Runtime stage (for when API project is added)
# FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
# WORKDIR /app
# COPY --from=publish /app/publish .
# EXPOSE 5000
# ENTRYPOINT ["dotnet", "NoraPA.API.dll"]

# For now, just verify the build works
FROM build AS final
WORKDIR /src
