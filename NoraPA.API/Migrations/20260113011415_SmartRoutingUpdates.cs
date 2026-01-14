using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NoraPA.API.Migrations
{
    /// <inheritdoc />
    public partial class SmartRoutingUpdates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ai_settings",
                columns: table => new
                {
                    id = table.Column<long>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    provider = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    model = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    api_key = table.Column<string>(type: "TEXT", nullable: true),
                    api_endpoint = table.Column<string>(type: "TEXT", nullable: true),
                    temperature = table.Column<decimal>(type: "TEXT", nullable: false, defaultValue: 0.7m),
                    max_tokens = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 4096),
                    is_active = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    cross_provider_enabled = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: false),
                    budget_mode = table.Column<int>(type: "INTEGER", nullable: false),
                    created_at = table.Column<DateTime>(type: "TEXT", nullable: false),
                    updated_at = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ai_settings", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "ai_usage_logs",
                columns: table => new
                {
                    id = table.Column<long>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    timestamp = table.Column<DateTime>(type: "TEXT", nullable: false),
                    model_name = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    task_type = table.Column<int>(type: "INTEGER", nullable: false),
                    complexity = table.Column<int>(type: "INTEGER", nullable: false),
                    input_tokens = table.Column<int>(type: "INTEGER", nullable: false),
                    output_tokens = table.Column<int>(type: "INTEGER", nullable: false),
                    cost_usd = table.Column<decimal>(type: "TEXT", nullable: false),
                    response_time_ms = table.Column<int>(type: "INTEGER", nullable: false),
                    quality_rating = table.Column<int>(type: "INTEGER", nullable: true),
                    analysis_id = table.Column<long>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ai_usage_logs", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "app_settings",
                columns: table => new
                {
                    key = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    value = table.Column<string>(type: "TEXT", nullable: true),
                    updated_at = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_app_settings", x => x.key);
                });

            migrationBuilder.CreateTable(
                name: "messages",
                columns: table => new
                {
                    id = table.Column<long>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    source = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    source_id = table.Column<string>(type: "TEXT", maxLength: 255, nullable: false),
                    from_address = table.Column<string>(type: "TEXT", maxLength: 255, nullable: true),
                    from_name = table.Column<string>(type: "TEXT", maxLength: 255, nullable: true),
                    to_addresses = table.Column<string>(type: "TEXT", nullable: true),
                    subject = table.Column<string>(type: "TEXT", nullable: true),
                    body_plain = table.Column<string>(type: "TEXT", nullable: true),
                    body_html = table.Column<string>(type: "TEXT", nullable: true),
                    received_at = table.Column<DateTime>(type: "TEXT", nullable: false),
                    processed_at = table.Column<DateTime>(type: "TEXT", nullable: true),
                    life_domain = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true),
                    importance = table.Column<string>(type: "TEXT", maxLength: 20, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_messages", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "ai_analyses",
                columns: table => new
                {
                    id = table.Column<long>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    message_id = table.Column<long>(type: "INTEGER", nullable: false),
                    summary = table.Column<string>(type: "TEXT", nullable: true),
                    obligations_analysis = table.Column<string>(type: "TEXT", nullable: true),
                    deadlines_analysis = table.Column<string>(type: "TEXT", nullable: true),
                    documents_analysis = table.Column<string>(type: "TEXT", nullable: true),
                    financial_records_analysis = table.Column<string>(type: "TEXT", nullable: true),
                    life_domain_analysis = table.Column<string>(type: "TEXT", nullable: true),
                    importance_analysis = table.Column<string>(type: "TEXT", nullable: true),
                    general_analysis = table.Column<string>(type: "TEXT", nullable: true),
                    raw_response = table.Column<string>(type: "TEXT", nullable: true),
                    analyzed_at = table.Column<DateTime>(type: "TEXT", nullable: false),
                    status = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false, defaultValue: "pending"),
                    task_complexity = table.Column<int>(type: "INTEGER", nullable: false),
                    model_used = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    cost_usd = table.Column<decimal>(type: "TEXT", nullable: false),
                    processing_time_ms = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ai_analyses", x => x.id);
                    table.ForeignKey(
                        name: "FK_ai_analyses_messages_message_id",
                        column: x => x.message_id,
                        principalTable: "messages",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "obligations",
                columns: table => new
                {
                    id = table.Column<long>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    message_id = table.Column<long>(type: "INTEGER", nullable: false),
                    action = table.Column<string>(type: "TEXT", nullable: false),
                    trigger_type = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true),
                    trigger_value = table.Column<string>(type: "TEXT", nullable: true),
                    mandatory = table.Column<bool>(type: "INTEGER", nullable: false),
                    consequence = table.Column<string>(type: "TEXT", nullable: true),
                    estimated_time = table.Column<TimeSpan>(type: "TEXT", nullable: true),
                    priority = table.Column<int>(type: "INTEGER", nullable: true),
                    status = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false, defaultValue: "pending"),
                    confidence_score = table.Column<decimal>(type: "TEXT", nullable: true),
                    created_at = table.Column<DateTime>(type: "TEXT", nullable: false),
                    completed_at = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_obligations", x => x.id);
                    table.ForeignKey(
                        name: "FK_obligations_messages_message_id",
                        column: x => x.message_id,
                        principalTable: "messages",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "deadlines",
                columns: table => new
                {
                    id = table.Column<long>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    message_id = table.Column<long>(type: "INTEGER", nullable: false),
                    obligation_id = table.Column<long>(type: "INTEGER", nullable: true),
                    deadline_type = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false, defaultValue: "absolute"),
                    deadline_date = table.Column<DateTime>(type: "TEXT", nullable: true),
                    relative_trigger = table.Column<string>(type: "TEXT", maxLength: 255, nullable: true),
                    relative_duration = table.Column<TimeSpan>(type: "TEXT", nullable: true),
                    description = table.Column<string>(type: "TEXT", nullable: true),
                    critical = table.Column<bool>(type: "INTEGER", nullable: false),
                    status = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false, defaultValue: "active")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_deadlines", x => x.id);
                    table.ForeignKey(
                        name: "FK_deadlines_messages_message_id",
                        column: x => x.message_id,
                        principalTable: "messages",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_deadlines_obligations_obligation_id",
                        column: x => x.obligation_id,
                        principalTable: "obligations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "tasks",
                columns: table => new
                {
                    id = table.Column<long>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    obligation_id = table.Column<long>(type: "INTEGER", nullable: true),
                    title = table.Column<string>(type: "TEXT", nullable: false),
                    description = table.Column<string>(type: "TEXT", nullable: true),
                    due_date = table.Column<DateTime>(type: "TEXT", nullable: true),
                    priority = table.Column<int>(type: "INTEGER", nullable: true),
                    status = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false, defaultValue: "pending"),
                    context_link = table.Column<string>(type: "TEXT", nullable: true),
                    created_at = table.Column<DateTime>(type: "TEXT", nullable: false),
                    completed_at = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tasks", x => x.id);
                    table.ForeignKey(
                        name: "FK_tasks_obligations_obligation_id",
                        column: x => x.obligation_id,
                        principalTable: "obligations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ai_analyses_message_id",
                table: "ai_analyses",
                column: "message_id");

            migrationBuilder.CreateIndex(
                name: "IX_deadlines_message_id",
                table: "deadlines",
                column: "message_id");

            migrationBuilder.CreateIndex(
                name: "IX_deadlines_obligation_id",
                table: "deadlines",
                column: "obligation_id");

            migrationBuilder.CreateIndex(
                name: "IX_messages_source_source_id",
                table: "messages",
                columns: new[] { "source", "source_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_obligations_message_id",
                table: "obligations",
                column: "message_id");

            migrationBuilder.CreateIndex(
                name: "IX_tasks_obligation_id",
                table: "tasks",
                column: "obligation_id",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ai_analyses");

            migrationBuilder.DropTable(
                name: "ai_settings");

            migrationBuilder.DropTable(
                name: "ai_usage_logs");

            migrationBuilder.DropTable(
                name: "app_settings");

            migrationBuilder.DropTable(
                name: "deadlines");

            migrationBuilder.DropTable(
                name: "tasks");

            migrationBuilder.DropTable(
                name: "obligations");

            migrationBuilder.DropTable(
                name: "messages");
        }
    }
}
