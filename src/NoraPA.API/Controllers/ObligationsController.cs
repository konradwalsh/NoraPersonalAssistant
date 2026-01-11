using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NoraPA.Core.Models;
using NoraPA.Infrastructure.Data;

namespace NoraPA.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ObligationsController : ControllerBase
{
    private readonly NoraDbContext _context;
    private readonly ILogger<ObligationsController> _logger;

    public ObligationsController(NoraDbContext context, ILogger<ObligationsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get all obligations with optional filtering
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Obligation>>> GetObligations(
        [FromQuery] string? status = null,
        [FromQuery] int? priority = null,
        [FromQuery] bool? mandatory = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var query = _context.Obligations
                .Include(o => o.Message)
                .Include(o => o.Deadlines)
                .Include(o => o.Tasks)
                .AsQueryable();

            if (!string.IsNullOrEmpty(status))
                query = query.Where(o => o.Status == status);

            if (priority.HasValue)
                query = query.Where(o => o.Priority == priority.Value);

            if (mandatory.HasValue)
                query = query.Where(o => o.Mandatory == mandatory.Value);

            var obligations = await query
                .OrderBy(o => o.Priority)
                .ThenByDescending(o => o.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(obligations);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving obligations");
            return StatusCode(500, "An error occurred while retrieving obligations");
        }
    }

    /// <summary>
    /// Get a specific obligation by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<Obligation>> GetObligation(long id)
    {
        try
        {
            var obligation = await _context.Obligations
                .Include(o => o.Message)
                .Include(o => o.Deadlines)
                .Include(o => o.Tasks)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (obligation == null)
                return NotFound();

            return Ok(obligation);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving obligation {ObligationId}", id);
            return StatusCode(500, "An error occurred while retrieving the obligation");
        }
    }

    /// <summary>
    /// Create a new obligation
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<Obligation>> CreateObligation(Obligation obligation)
    {
        try
        {
            obligation.CreatedAt = DateTime.UtcNow;
            _context.Obligations.Add(obligation);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Created obligation {ObligationId}", obligation.Id);

            return CreatedAtAction(nameof(GetObligation), new { id = obligation.Id }, obligation);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating obligation");
            return StatusCode(500, "An error occurred while creating the obligation");
        }
    }

    /// <summary>
    /// Update an obligation
    /// </summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateObligation(long id, Obligation obligation)
    {
        if (id != obligation.Id)
            return BadRequest();

        try
        {
            _context.Entry(obligation).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Updated obligation {ObligationId}", id);

            return NoContent();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!await ObligationExists(id))
                return NotFound();
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating obligation {ObligationId}", id);
            return StatusCode(500, "An error occurred while updating the obligation");
        }
    }

    /// <summary>
    /// Update obligation status
    /// </summary>
    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateStatus(long id, [FromBody] string status)
    {
        try
        {
            var obligation = await _context.Obligations.FindAsync(id);
            if (obligation == null)
                return NotFound();

            obligation.Status = status;
            
            if (status == "completed")
                obligation.CompletedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Updated obligation {ObligationId} status to {Status}", id, status);

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating obligation {ObligationId} status", id);
            return StatusCode(500, "An error occurred while updating the obligation status");
        }
    }

    /// <summary>
    /// Delete an obligation
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteObligation(long id)
    {
        try
        {
            var obligation = await _context.Obligations.FindAsync(id);
            if (obligation == null)
                return NotFound();

            _context.Obligations.Remove(obligation);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Deleted obligation {ObligationId}", id);

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting obligation {ObligationId}", id);
            return StatusCode(500, "An error occurred while deleting the obligation");
        }
    }

    /// <summary>
    /// Get obligation statistics
    /// </summary>
    [HttpGet("stats")]
    public async Task<ActionResult<object>> GetStats()
    {
        try
        {
            var stats = new
            {
                total = await _context.Obligations.CountAsync(),
                byStatus = await _context.Obligations
                    .GroupBy(o => o.Status)
                    .Select(g => new { status = g.Key, count = g.Count() })
                    .ToListAsync(),
                byPriority = await _context.Obligations
                    .GroupBy(o => o.Priority)
                    .Select(g => new { priority = g.Key, count = g.Count() })
                    .ToListAsync(),
                mandatory = await _context.Obligations.CountAsync(o => o.Mandatory),
                highConfidence = await _context.Obligations.CountAsync(o => o.ConfidenceScore >= 0.85m),
                pending = await _context.Obligations.CountAsync(o => o.Status == "pending"),
                completed = await _context.Obligations.CountAsync(o => o.Status == "completed")
            };

            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving obligation statistics");
            return StatusCode(500, "An error occurred while retrieving statistics");
        }
    }

    private async Task<bool> ObligationExists(long id)
    {
        return await _context.Obligations.AnyAsync(e => e.Id == id);
    }
}
