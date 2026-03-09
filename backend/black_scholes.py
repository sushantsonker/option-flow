import math
from typing import Dict

from scipy.stats import norm


def black_scholes(
    spot_price: float,
    strike_price: float,
    time_to_expiry_in_years: float,
    risk_free_rate: float,
    volatility: float,
    option_type: str,
) -> Dict[str, float]:
    """
    Calculate Black-Scholes price and Greeks for a European option.

    Parameters
    ----------
    spot_price : float
        Current price of the underlying asset (S).
    strike_price : float
        Strike price of the option (K).
    time_to_expiry_in_years : float
        Time to expiration in years (T).
    risk_free_rate : float
        Continuously compounded risk-free interest rate (r).
    volatility : float
        Volatility of the underlying asset (sigma).
    option_type : str
        'call' or 'put'.

    Returns
    -------
    Dict[str, float]
        Dictionary containing:
        - price
        - delta
        - gamma
        - theta
        - vega
        - rho
    """
    if time_to_expiry_in_years <= 0:
        raise ValueError("time_to_expiry_in_years must be positive for Black-Scholes.")
    if volatility <= 0:
        raise ValueError("volatility must be positive for Black-Scholes.")

    option_type = option_type.lower()
    if option_type not in {"call", "put"}:
        raise ValueError("option_type must be 'call' or 'put'.")

    S = spot_price
    K = strike_price
    T = time_to_expiry_in_years
    r = risk_free_rate
    sigma = volatility

    d1 = (math.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * math.sqrt(T))
    d2 = d1 - sigma * math.sqrt(T)

    if option_type == "call":
        price = S * norm.cdf(d1) - K * math.exp(-r * T) * norm.cdf(d2)
        # Delta: how much the option price changes for a small change in the underlying price.
        delta = norm.cdf(d1)
        # Rho: how much the option price changes for a small change in interest rates.
        rho = K * T * math.exp(-r * T) * norm.cdf(d2)
        # Theta: how much the option price changes as time passes, holding everything else constant.
        theta = (
            -S * norm.pdf(d1) * sigma / (2 * math.sqrt(T))
            - r * K * math.exp(-r * T) * norm.cdf(d2)
        )
    else:  # put
        price = K * math.exp(-r * T) * norm.cdf(-d2) - S * norm.cdf(-d1)
        # Delta: how much the option price changes for a small change in the underlying price.
        delta = norm.cdf(d1) - 1
        # Rho: how much the option price changes for a small change in interest rates.
        rho = -K * T * math.exp(-r * T) * norm.cdf(-d2)
        # Theta: how much the option price changes as time passes, holding everything else constant.
        theta = (
            -S * norm.pdf(d1) * sigma / (2 * math.sqrt(T))
            + r * K * math.exp(-r * T) * norm.cdf(-d2)
        )

    # Gamma: how quickly Delta itself changes when the underlying price moves.
    gamma = norm.pdf(d1) / (S * sigma * math.sqrt(T))

    # Vega: how much the option price changes for a small change in volatility.
    vega = S * norm.pdf(d1) * math.sqrt(T)

    return {
        "price": price,
        "delta": delta,
        "gamma": gamma,
        "theta": theta,
        "vega": vega,
        "rho": rho,
    }

