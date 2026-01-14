using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NoraPA.API.Migrations
{
    /// <inheritdoc />
    public partial class AddUserProfileAndIntelligence : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "attachments",
                columns: table => new
                {
                    id = table.Column<long>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    message_id = table.Column<long>(type: "INTEGER", nullable: false),
                    filename = table.Column<string>(type: "TEXT", maxLength: 255, nullable: false),
                    mime_type = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    size_bytes = table.Column<long>(type: "INTEGER", nullable: false),
                    local_path = table.Column<string>(type: "TEXT", maxLength: 512, nullable: true),
                    source_id = table.Column<string>(type: "TEXT", maxLength: 255, nullable: true),
                    created_at = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_attachments", x => x.id);
                    table.ForeignKey(
                        name: "FK_attachments_messages_message_id",
                        column: x => x.message_id,
                        principalTable: "messages",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "user_profiles",
                columns: table => new
                {
                    id = table.Column<long>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    full_name = table.Column<string>(type: "TEXT", maxLength: 255, nullable: false),
                    bio = table.Column<string>(type: "TEXT", nullable: true),
                    career_context = table.Column<string>(type: "TEXT", nullable: true),
                    household_context = table.Column<string>(type: "TEXT", nullable: true),
                    exclusion_instructions = table.Column<string>(type: "TEXT", nullable: true),
                    ai_directives = table.Column<string>(type: "TEXT", nullable: true),
                    updated_at = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_profiles", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_attachments_message_id",
                table: "attachments",
                column: "message_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "attachments");

            migrationBuilder.DropTable(
                name: "user_profiles");
        }
    }
}
