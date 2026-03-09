import os
from typing import Any, Dict

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from black_scholes import black_scholes
from data_fetcher import get_option_expiries, get_options_chain, get_stock_info


# Load environment variables (e.g., API keys, config) from .env
load_dotenv()


app = FastAPI(title="Option Flow Backend API")

# Enable CORS for all origins so the frontend can call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/quote/{ticker}")
async def quote(ticker: str) -> Dict[str, Any]:
    """
    Get current price, company name, and basic stats for a ticker.
    """
    info = get_stock_info(ticker)
    if info is None:
        raise HTTPException(status_code=404, detail="Ticker not found or unavailable.")

    return {
        "symbol": info.get("symbol"),
        "name": info.get("longName") or info.get("shortName"),
        "currency": info.get("currency"),
        "exchange": info.get("exchange"),
        "quoteType": info.get("quoteType"),
        "currentPrice": info.get("currentPrice"),
        "previousClose": info.get("previousClose"),
        "open": info.get("open"),
        "dayHigh": info.get("dayHigh"),
        "dayLow": info.get("dayLow"),
        "marketCap": info.get("marketCap"),
    }


@app.get("/api/expiries/{ticker}")
async def expiries(ticker: str) -> Dict[str, Any]:
    """
    Get available option expiry dates for a ticker.
    """
    dates = get_option_expiries(ticker)
    if dates is None:
        raise HTTPException(status_code=404, detail="Ticker not found or has no options.")

    return {"symbol": ticker.upper(), "expiries": dates}


@app.get("/api/chain/{ticker}/{expiry}")
async def chain(ticker: str, expiry: str) -> Dict[str, Any]:
    """
    Get full options chain (calls and puts) for a ticker and expiry date.
    """
    options_chain = get_options_chain(ticker, expiry)
    if options_chain is None:
        raise HTTPException(
            status_code=404,
            detail="Ticker or expiry not found, or options data unavailable.",
        )

    return {
        "symbol": ticker.upper(),
        "expiry": expiry,
        "calls": options_chain.get("calls", []),
        "puts": options_chain.get("puts", []),
    }


@app.get("/api/greeks")
async def greeks(
    spot: float = Query(..., description="Current underlying price."),
    strike: float = Query(..., description="Option strike price."),
    expiry: float = Query(
        ...,
        description="Time to expiry in years (e.g., 0.5 for half a year).",
    ),
    iv: float = Query(..., description="Implied volatility as a decimal (e.g., 0.2)."),
    type: str = Query(..., alias="type", description="'call' or 'put'."),
) -> Dict[str, Any]:
    """
    Calculate Black-Scholes price and Greeks for a European option.
    """
    option_type = type.lower()
    # Risk-free rate can be configured via environment variable; default to 2% if unset.
    try:
        risk_free_rate = float(os.getenv("RISK_FREE_RATE", "0.02"))
    except ValueError:
        risk_free_rate = 0.02

    try:
        result = black_scholes(
            spot_price=spot,
            strike_price=strike,
            time_to_expiry_in_years=expiry,
            risk_free_rate=risk_free_rate,
            volatility=iv,
            option_type=option_type,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return {
        "inputs": {
            "spot": spot,
            "strike": strike,
            "expiry_years": expiry,
            "iv": iv,
            "option_type": option_type,
            "risk_free_rate": risk_free_rate,
        },
        "results": result,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=int(os.getenv("PORT", "8000")),
        reload=True,
    )

