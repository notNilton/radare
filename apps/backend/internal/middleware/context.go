package middleware

import (
	"context"
	"strconv"
)

func TenantIDFromContext(ctx context.Context) (uint, bool) {
	switch value := ctx.Value("tenantID").(type) {
	case uint:
		return value, value > 0
	case *uint:
		if value == nil {
			return 0, false
		}
		return *value, *value > 0
	case float64:
		if value <= 0 {
			return 0, false
		}
		return uint(value), true
	case int:
		return uint(value), value > 0
	case string:
		parsed, err := strconv.ParseUint(value, 10, 64)
		if err != nil || parsed == 0 {
			return 0, false
		}
		return uint(parsed), true
	default:
		return 0, false
	}
}

func TenantIDPointerFromContext(ctx context.Context) (*uint, bool) {
	tenantID, ok := TenantIDFromContext(ctx)
	if !ok {
		return nil, false
	}
	return &tenantID, true
}
