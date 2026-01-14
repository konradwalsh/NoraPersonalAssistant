using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NoraPA.API.Migrations
{
    /// <inheritdoc />
    public partial class AddGoogleCalendarIdToCalendarEvent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "google_calendar_id",
                table: "calendar_events",
                type: "TEXT",
                maxLength: 255,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "google_calendar_id",
                table: "calendar_events");
        }
    }
}
