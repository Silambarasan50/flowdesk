namespace FlowDesk.Api.Dtos;

public record AnalyticsSummaryDto(
    int Total,
    int Open,
    int InProgress,
    int Breached,
    int Resolved);
