using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NoraPA.Core.Models;
using NoraPA.Infrastructure.Data;

namespace NoraPA.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MessagesController : ControllerBase
{
    private readonly NoraDbContext _context;
    private readonly ILogger<MessagesController> _logger;

    public MessagesController(NoraDbContext context, ILogger<MessagesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get all messages with optional filtering
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Message>>> GetMessages(
        [FromQuery] string? source = null,
        [FromQuery] string? lifeDomain = null,
        [FromQuery] string? importance = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var query = _context.Messages
                .Include(m => m.Obligations)
                .Include(m => m.Deadlines)
                .AsQueryable();

            if (!string.IsNullOrEmpty(source))
                query = query.Where(m => m.Source == source);

            if (!string.IsNullOrEmpty(lifeDomain))
                query = query.Where(m => m.LifeDomain == lifeDomain);

            if (!string.IsNullOrEmpty(importance))
                query = query.Where(m => m.Importance == importance);

            var messages = await query
                .OrderByDescending(m => m.ReceivedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(messages);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving messages");
            return StatusCode(500, "An error occurred while retrieving messages");
        }
    }

    /// <summary>
    /// Get a specific message by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<Message>> GetMessage(long id)
    {
        try
        {
            var message = await _context.Messages
                .Include(m => m.Obligations)
                .Include(m => m.Deadlines)
                .Include(m => m.Documents)
                .Include(m => m.FinancialRecords)
                .Include(m => m.AIAnalyses)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (message == null)
                return NotFound();

            return Ok(message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving message {MessageId}", id);
            return StatusCode(500, "An error occurred while retrieving the message");
        }
    }

    /// <summary>
    /// Create a new message
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<Message>> CreateMessage(Message message)
    {
        try
        {
            message.ReceivedAt = DateTime.UtcNow;
            _context.Messages.Add(message);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Created message {MessageId} from {Source}", message.Id, message.Source);

            return CreatedAtAction(nameof(GetMessage), new { id = message.Id }, message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating message");
            return StatusCode(500, "An error occurred while creating the message");
        }
    }

    /// <summary>
    /// Update a message
    /// </summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateMessage(long id, Message message)
    {
        if (id != message.Id)
            return BadRequest();

        try
        {
            _context.Entry(message).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Updated message {MessageId}", id);

            return NoContent();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!await MessageExists(id))
                return NotFound();
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating message {MessageId}", id);
            return StatusCode(500, "An error occurred while updating the message");
        }
    }

    /// <summary>
    /// Delete a message
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteMessage(long id)
    {
        try
        {
            var message = await _context.Messages.FindAsync(id);
            if (message == null)
                return NotFound();

            _context.Messages.Remove(message);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Deleted message {MessageId}", id);

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting message {MessageId}", id);
            return StatusCode(500, "An error occurred while deleting the message");
        }
    }

    /// <summary>
    /// Get message statistics
    /// </summary>
    [HttpGet("stats")]
    public async Task<ActionResult<object>> GetStats()
    {
        try
        {
            var stats = new
            {
                totalMessages = await _context.Messages.CountAsync(),
                bySource = await _context.Messages
                    .GroupBy(m => m.Source)
                    .Select(g => new { source = g.Key, count = g.Count() })
                    .ToListAsync(),
                byImportance = await _context.Messages
                    .GroupBy(m => m.Importance)
                    .Select(g => new { importance = g.Key, count = g.Count() })
                    .ToListAsync(),
                byLifeDomain = await _context.Messages
                    .GroupBy(m => m.LifeDomain)
                    .Select(g => new { domain = g.Key, count = g.Count() })
                    .ToListAsync(),
                recentMessages = await _context.Messages
                    .OrderByDescending(m => m.ReceivedAt)
                    .Take(5)
                    .Select(m => new { m.Id, m.Subject, m.ReceivedAt, m.Source })
                    .ToListAsync()
            };

            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving message statistics");
            return StatusCode(500, "An error occurred while retrieving statistics");
        }
    }

    private async Task<bool> MessageExists(long id)
    {
        return await _context.Messages.AnyAsync(e => e.Id == id);
    }
}
